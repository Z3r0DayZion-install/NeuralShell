use std::ffi::OsStr;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use anyhow::{anyhow, bail, Context, Result};
use chrono::Local;
use clap::{Parser, Subcommand};
use serde::Serialize;
use sha2::{Digest, Sha256};
use walkdir::WalkDir;

#[derive(Debug, Parser)]
#[command(name = "neuralshell-release")]
#[command(about = "NeuralShell release/bundle automation", long_about = None)]
struct Cli {
  #[command(subcommand)]
  cmd: Cmd,
}

#[derive(Debug, Subcommand)]
enum Cmd {
  /// Build and assemble a release bundle under out/releases/
  Bundle(BundleArgs),
}

#[derive(Debug, Parser)]
struct BundleArgs {
  /// Repo root (defaults to current directory)
  #[arg(long)]
  root: Option<PathBuf>,

  /// Desktop dist directory
  #[arg(long, default_value = "NeuralShell_Desktop/dist")]
  desktop_dist: PathBuf,

  /// Run desktop release verification/checksums
  #[arg(long, default_value_t = true)]
  desktop: bool,

  /// Build docker image
  #[arg(long, default_value_t = true)]
  docker: bool,

  /// Docker image tag
  #[arg(long)]
  docker_tag: Option<String>,

  /// Dockerfile path
  #[arg(long, default_value = "Dockerfile")]
  dockerfile: PathBuf,

  /// Publish container port to this host port
  #[arg(long, default_value_t = 3000)]
  port: u16,

  /// Save `docker save` tarball into bundle
  #[arg(long, default_value_t = true)]
  docker_save: bool,

  /// Skip collecting git metadata (status/diff)
  #[arg(long, default_value_t = false)]
  no_git: bool,
}

#[derive(Debug, Serialize)]
struct SumEntry {
  path: String,
  sha256: String,
  bytes: u64,
}

fn run(cmd: &mut Command, label: &str) -> Result<String> {
  let out = cmd.output().with_context(|| format!("run {label}"))?;
  if !out.status.success() {
    bail!(
      "{label} failed (exit={})\nstdout:\n{}\nstderr:\n{}",
      out.status,
      String::from_utf8_lossy(&out.stdout),
      String::from_utf8_lossy(&out.stderr)
    );
  }
  Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn npm_cmd() -> Command {
  if cfg!(windows) {
    let comspec = std::env::var("ComSpec").unwrap_or_else(|_| "cmd.exe".to_string());
    let mut cmd = Command::new(comspec);
    cmd.args(["/d", "/s", "/c", "npm"]);
    cmd
  } else {
    Command::new("npm")
  }
}

fn run_status_ok(cmd: &mut Command) -> bool {
  cmd.stdout(Stdio::null())
    .stderr(Stdio::null())
    .status()
    .map(|s| s.success())
    .unwrap_or(false)
}

fn repo_root(arg: &BundleArgs) -> Result<PathBuf> {
  if let Some(r) = &arg.root {
    return Ok(r.clone());
  }
  Ok(std::env::current_dir().context("current_dir")?)
}

fn git_sha_short(root: &Path) -> Result<String> {
  let s = run(
    Command::new("git")
      .arg("rev-parse")
      .arg("--short")
      .arg("HEAD")
      .current_dir(root),
    "git rev-parse",
  )?;
  Ok(s.trim().to_string())
}

fn docker_ensure_running() -> Result<()> {
  if run_status_ok(Command::new("docker").arg("info")) {
    return Ok(());
  }

  if cfg!(windows) {
    let _ = Command::new("docker")
      .args(["desktop", "start"])
      .status();
  }

  for _ in 0..60 {
    if run_status_ok(Command::new("docker").arg("info")) {
      return Ok(());
    }
    std::thread::sleep(Duration::from_secs(2));
  }

  bail!("docker engine is not reachable (docker info failed)");
}

fn desktop_verify(root: &Path) -> Result<()> {
  let mut verify = npm_cmd();
  verify
    .current_dir(root)
    .env("NODE_ENV", "development")
    .args(["--prefix", "NeuralShell_Desktop", "run", "verify:release"]);
  run(&mut verify, "desktop verify:release")?;

  let mut checksums = npm_cmd();
  checksums
    .current_dir(root)
    .env("NODE_ENV", "development")
    .args(["--prefix", "NeuralShell_Desktop", "run", "checksums"]);
  run(&mut checksums, "desktop checksums")?;

  Ok(())
}

fn copy_if_exists(src: &Path, dst: &Path) -> Result<()> {
  if src.exists() {
    if let Some(parent) = dst.parent() {
      fs::create_dir_all(parent).with_context(|| format!("mkdir {}", parent.display()))?;
    }
    fs::copy(src, dst).with_context(|| format!("copy {} -> {}", src.display(), dst.display()))?;
  }
  Ok(())
}

fn sha256_file(p: &Path) -> Result<String> {
  let data = fs::read(p).with_context(|| format!("read {}", p.display()))?;
  let mut h = Sha256::new();
  h.update(&data);
  Ok(format!("{:x}", h.finalize()))
}

fn write_text(p: &Path, s: &str) -> Result<()> {
  if let Some(parent) = p.parent() {
    fs::create_dir_all(parent).with_context(|| format!("mkdir {}", parent.display()))?;
  }
  fs::write(p, s.as_bytes()).with_context(|| format!("write {}", p.display()))
}

fn docker_build(root: &Path, dockerfile: &Path, tag: &str) -> Result<()> {
  docker_ensure_running()?;

  let df = root.join(dockerfile);
  if !df.exists() {
    bail!("Dockerfile not found: {}", df.display());
  }

  run(
    Command::new("docker")
      .current_dir(root)
      .args(["build", "-t", tag, "-f"])
      .arg(df)
      .arg("."),
    "docker build",
  )?;

  Ok(())
}

fn http_get_health(port: u16) -> Result<String> {
  let mut stream = TcpStream::connect(("127.0.0.1", port)).context("connect localhost")?;
  stream
    .set_read_timeout(Some(Duration::from_secs(2)))
    .ok();
  stream
    .set_write_timeout(Some(Duration::from_secs(2)))
    .ok();

  let req = b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";
  stream.write_all(req).context("write request")?;
  stream.flush().ok();

  let mut buf = Vec::new();
  stream.read_to_end(&mut buf).context("read response")?;
  let text = String::from_utf8_lossy(&buf);

  let mut parts = text.splitn(2, "\r\n\r\n");
  let head = parts.next().unwrap_or("");
  let body = parts.next().unwrap_or("");

  let status_line = head.lines().next().unwrap_or("");
  if !status_line.contains(" 200 ") {
    bail!("health status not OK: {status_line}");
  }

  Ok(body.to_string())
}


fn pick_free_port() -> Result<u16> {
  let l = TcpListener::bind(("127.0.0.1", 0)).context("bind ephemeral port")?;
  Ok(l.local_addr().context("local_addr")?.port())
}

fn pick_smoke_port(preferred: u16) -> Result<u16> {
  if preferred == 0 {
    return pick_free_port();
  }
  match TcpListener::bind(("127.0.0.1", preferred)) {
    Ok(l) => {
      drop(l);
      Ok(preferred)
    }
    Err(_) => pick_free_port(),
  }
}
fn docker_smoke(tag: &str, port: u16) -> Result<(String, String)> {
  docker_ensure_running()?;
  let name = format!("neuralshell-smoke-{}", pseudo_id());
  let prompt_token = format!("smoke-{}", pseudo_id());

  let _ = Command::new("docker").args(["rm", "-f", &name]).output();

  run(
    Command::new("docker").args([
      "run",
      "-d",
      "-p",
      &format!("127.0.0.1:{port}:3000"),
      "-e",
      &format!("PROMPT_TOKEN={}", prompt_token),
      "--name",
      &name,
      tag,
    ]),
    "docker run",
  )?;

  let mut ok_body = None;
  for _ in 0..60 {
    match http_get_health(port) {
      Ok(body) => {
        ok_body = Some(body);
        break;
      }
      Err(_) => {}
    }
    std::thread::sleep(Duration::from_millis(500));
  }

  let logs = Command::new("docker")
    .args(["logs", "--tail", "200", &name])
    .output()
    .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
    .unwrap_or_else(|_| String::new());

  let _ = Command::new("docker").args(["rm", "-f", &name]).output();

  let body = ok_body.ok_or_else(|| anyhow!("health check failed: http://localhost:{port}/health"))?;
  Ok((body, logs))
}

fn docker_save(tag: &str, out_tar: &Path) -> Result<()> {
  docker_ensure_running()?;
  if let Some(parent) = out_tar.parent() {
    fs::create_dir_all(parent).with_context(|| format!("mkdir {}", parent.display()))?;
  }
  run(
    Command::new("docker")
      .args(["save", "-o"])
      .arg(out_tar)
      .arg(tag),
    "docker save",
  )?;
  Ok(())
}

fn docker_inspect(tag: &str) -> Result<String> {
  docker_ensure_running()?;
  run(
    Command::new("docker").args(["image", "inspect", tag]),
    "docker image inspect",
  )
}

fn pseudo_id() -> String {
  let t = Local::now().timestamp_nanos_opt().unwrap_or(0);
  let mut h = Sha256::new();
  h.update(t.to_le_bytes());
  let out = h.finalize();
  hex::encode(&out[0..4])
}

fn file_name_matches(p: &Path, prefix: &str, suffix: &str) -> bool {
  match p.file_name().and_then(OsStr::to_str) {
    Some(name) => name.starts_with(prefix) && name.ends_with(suffix),
    None => false,
  }
}

fn bundle(args: BundleArgs) -> Result<()> {
  let root = repo_root(&args)?;
  let sha = git_sha_short(&root).unwrap_or_else(|_| "nogit".to_string());
  let ts = Local::now().format("%Y%m%d-%H%M%S").to_string();

  let out_root = root.join("out").join("releases").join(format!("{ts}-{sha}"));
  let out_desktop = out_root.join("desktop");
  let out_docker = out_root.join("docker");
  let out_git = out_root.join("git");

  fs::create_dir_all(&out_desktop).context("mkdir desktop")?;
  fs::create_dir_all(&out_docker).context("mkdir docker")?;
  fs::create_dir_all(&out_git).context("mkdir git")?;

  if args.desktop {
    desktop_verify(&root)?;

    let dist = root.join(&args.desktop_dist);
    if !dist.exists() {
      bail!("desktop dist not found: {}", dist.display());
    }

    for entry in fs::read_dir(&dist).with_context(|| format!("read dir {}", dist.display()))? {
      let e = entry?;
      let p = e.path();
      if file_name_matches(&p, "NeuralShell-TEAR-Setup-", ".exe")
        || file_name_matches(&p, "NeuralShell-TEAR-Portable-", ".exe")
        || file_name_matches(&p, "NeuralShell-TEAR-Runtime", ".exe")
        || file_name_matches(&p, "latest", ".yml")
        || file_name_matches(&p, "RELEASE_CHECKSUMS", ".txt")
      {
        let dst = out_desktop.join(p.file_name().unwrap());
        copy_if_exists(&p, &dst)?;
      }
    }
  }

  let mut docker_smoke_port: Option<u16> = None;

  let docker_tag = args
    .docker_tag
    .clone()
    .unwrap_or_else(|| format!("neuralshell:1.0.0-dirty-{sha}"));
  if args.docker {
    docker_build(&root, &args.dockerfile, &docker_tag)?;
    let host_port = pick_smoke_port(args.port)?;
    docker_smoke_port = Some(host_port);
    let (health_body, logs) = docker_smoke(&docker_tag, host_port)?;
    write_text(&out_docker.join("health.json"), &health_body)?;
    write_text(&out_docker.join("container_logs.txt"), &logs)?;

    let inspect = docker_inspect(&docker_tag)?;
    write_text(&out_docker.join("image_inspect.json"), &inspect)?;

    if args.docker_save {
      docker_save(
        &docker_tag,
        &out_docker.join(format!("{}-image.tar", docker_tag.replace(':', "_"))),
      )?;
    }
  }

  if !args.no_git {
    let head = run(
      Command::new("git").arg("rev-parse").arg("HEAD").current_dir(&root),
      "git head",
    )
    .unwrap_or_default();
    let status = run(
      Command::new("git")
        .args(["status", "--porcelain=v1"])
        .current_dir(&root),
      "git status",
    )
    .unwrap_or_default();
    let diff = run(Command::new("git").arg("diff").current_dir(&root), "git diff")
      .unwrap_or_default();
    write_text(&out_git.join("HEAD.txt"), head.trim())?;
    write_text(&out_git.join("status_porcelain.txt"), &status)?;
    write_text(&out_git.join("diff.patch"), &diff)?;
  }

  let node_v = run(Command::new("node").arg("-v"), "node -v").unwrap_or_default();
  let npm_v = {
    let mut cmd = npm_cmd();
    cmd.arg("-v");
    run(&mut cmd, "npm -v").unwrap_or_default()
  };
  let docker_v = run(Command::new("docker").arg("--version"), "docker --version").unwrap_or_default();

  let mut report = String::new();
  report.push_str("NeuralShell Rust Release Bundle\n");
  report.push_str(&format!("Timestamp: {ts}\n"));
  report.push_str(&format!("Git: {sha} (dirty possible)\n"));
  report.push_str(&format!("Node: {} / npm: {}\n", node_v.trim(), npm_v.trim()));
  report.push_str(&format!("Docker: {}\n", docker_v.trim()));
  report.push_str(&format!("Docker tag: {docker_tag}\n"));
  if let Some(p) = docker_smoke_port {
    report.push_str(&format!("Docker smoke port: {p}\n"));
  }
  report.push_str("\nNotes:\n");
  report.push_str("- EXEs are not code-signed.\n");
  report.push_str("- Docker build runs npm postinstall in container mode (NEURALSHELL_CONTAINER=1).\n");

  write_text(&out_root.join("REPORT.txt"), &report)?;

  let mut entries: Vec<SumEntry> = Vec::new();
  for e in WalkDir::new(&out_root).into_iter().filter_map(|e| e.ok()) {
    if !e.file_type().is_file() {
      continue;
    }
    let p = e.path();
    let rel = p
      .strip_prefix(&out_root)
      .unwrap()
      .to_string_lossy()
      .replace('\\', "/");
    let bytes = e.metadata().map(|m| m.len()).unwrap_or(0);
    let sha256 = sha256_file(p)?;
    entries.push(SumEntry { path: rel, sha256, bytes });
  }
  entries.sort_by(|a, b| a.path.cmp(&b.path));
  let sums = serde_json::to_string_pretty(&entries).context("serialize sums")?;
  write_text(&out_root.join("SHA256SUMS.json"), &sums)?;

  let mut stdout = std::io::stdout();
  writeln!(stdout, "RELEASE_DIR={}", out_root.display()).ok();
  Ok(())
}

fn main() -> Result<()> {
  let cli = Cli::parse();
  match cli.cmd {
    Cmd::Bundle(args) => bundle(args),
  }
}
