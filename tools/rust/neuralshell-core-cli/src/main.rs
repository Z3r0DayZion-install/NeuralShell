use std::io::{Read, Write};

use anyhow::{Context, Result};
use clap::Parser;

#[derive(Debug, Parser)]
#[command(name = "neuralshell-core-cli")]
#[command(about = "Rust router-core selector CLI", long_about = None)]
struct Args {
    /// Read request JSON from this file (defaults to stdin)
    #[arg(long)]
    input: Option<String>,
}

fn read_all(path: &Option<String>) -> Result<Vec<u8>> {
    let mut buf = Vec::new();
    match path {
        Some(p) => {
            buf = std::fs::read(p).with_context(|| format!("read input file: {p}"))?;
        }
        None => {
            std::io::stdin()
                .read_to_end(&mut buf)
                .context("read stdin")?;
        }
    }
    Ok(buf)
}

fn main() -> Result<()> {
    let args = Args::parse();
    let raw = read_all(&args.input)?;
    let s = String::from_utf8(raw).context("input must be utf-8")?;

    let out = neuralshell_core::select_from_json(&s).context("select_from_json")?;
    let mut stdout = std::io::stdout();
    stdout.write_all(out.as_bytes()).context("write stdout")?;
    stdout.write_all(b"\n").ok();
    Ok(())
}
