const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");
const WebSocket = require("ws");

const PROOF_VIEW_ID = "neuralshell.proofView";

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload, secret, ttlSeconds = 180) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + Math.max(30, Number(ttlSeconds) || 180)
  };
  const headerSeg = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadSeg = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${headerSeg}.${payloadSeg}`;
  const sig = crypto
    .createHmac("sha256", String(secret || ""))
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signingInput}.${sig}`;
}

function runGitShow(workspacePath, relativePath) {
  const result = spawnSync("git", ["show", `HEAD:${relativePath.replace(/\\/g, "/")}`], {
    cwd: workspacePath,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `Unable to read HEAD:${relativePath}`);
  }
  return result.stdout;
}

function runGitSha(workspacePath) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: workspacePath,
    encoding: "utf8"
  });
  if (result.status !== 0) return "";
  return String(result.stdout || "").trim();
}

function createTempSnapshot(filePath, content) {
  const ext = path.extname(filePath || "") || ".txt";
  const hash = crypto.createHash("sha256").update(String(filePath || "")).digest("hex").slice(0, 10);
  const tempFile = path.join(os.tmpdir(), `neuralshell-head-${hash}${ext}`);
  fs.writeFileSync(tempFile, content, "utf8");
  return tempFile;
}

function executeProofBundle(workspacePath, output) {
  return new Promise((resolve) => {
    const proc = spawn("npm", ["run", "proof:bundle"], {
      cwd: workspacePath,
      shell: true
    });
    proc.stdout.on("data", (chunk) => output.append(chunk.toString()));
    proc.stderr.on("data", (chunk) => output.append(chunk.toString()));
    proc.on("close", (code) => resolve(Number(code || 0)));
  });
}

function extractSelection(editor) {
  if (!editor || !editor.selection) return "";
  if (editor.selection.isEmpty) return "";
  return editor.document.getText(editor.selection);
}

class ProofViewProvider {
  constructor() {
    this._view = null;
    this._state = {
      status: "idle",
      summary: "Awaiting command.",
      sha: "",
      detail: ""
    };
  }

  resolveWebviewView(view) {
    this._view = view;
    this._render();
  }

  setState(nextState) {
    this._state = {
      ...this._state,
      ...(nextState || {})
    };
    this._render();
  }

  _render() {
    if (!this._view) return;
    const status = String(this._state.status || "idle");
    const tone =
      status === "ok"
        ? "#16a34a"
        : status === "failed"
          ? "#f43f5e"
          : status === "running"
            ? "#22d3ee"
            : "#64748b";

    this._view.webview.options = { enableScripts: false };
    this._view.webview.html = `
      <!doctype html>
      <html>
      <body style="font-family: ui-sans-serif, system-ui; background: #020617; color: #e2e8f0; margin: 12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="width:10px;height:10px;border-radius:999px;background:${tone};display:inline-block;"></span>
          <strong style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Proof Status: ${status}</strong>
        </div>
        <div style="font-size:12px;line-height:1.5;opacity:.9;">${String(this._state.summary || "")}</div>
        ${this._state.sha ? `<div style="margin-top:8px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:11px;color:#67e8f9;">SHA: ${this._state.sha}</div>` : ""}
        ${this._state.detail ? `<pre style="margin-top:10px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px;white-space:pre-wrap;font-size:11px;max-height:220px;overflow:auto;">${String(this._state.detail)}</pre>` : ""}
      </body>
      </html>
    `;
  }
}

function buildWsToken() {
  const explicitToken = String(process.env.NS_DAEMON_WS_TOKEN || "").trim();
  if (explicitToken) return explicitToken;
  const secret = String(process.env.NS_DAEMON_JWT_SECRET || "").trim();
  if (!secret) return "";
  return signJwt({
    aud: "neuralshell-ws-bridge",
    scope: "proof:run",
    sub: "vscode"
  }, secret, 180);
}

function runProofThroughWs({ output, workspacePath, filePath, selection, proofView }) {
  return new Promise((resolve) => {
    const token = buildWsToken();
    const url = `ws://127.0.0.1:55015/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    let finished = false;
    let sha = "";
    let mark = "❌";

    const finish = (result) => {
      if (finished) return;
      finished = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve(result);
    };

    ws.on("open", () => {
      proofView.setState({
        status: "running",
        summary: "Connected to local daemon bridge. Running proof..."
      });
      ws.send(JSON.stringify({
        action: "proof.run",
        workspacePath,
        filePath,
        selection
      }));
    });

    ws.on("message", (raw) => {
      let packet;
      try {
        packet = JSON.parse(String(raw || ""));
      } catch {
        return;
      }
      const action = String(packet.action || "");
      if (action === "proof.log") {
        output.append(String(packet.line || ""));
      }
      if (action === "proof.complete") {
        sha = String(packet.sha || "");
        mark = packet.ok ? "✅" : "❌";
        finish({
          ok: Boolean(packet.ok),
          sha,
          mark,
          exitCode: Number(packet.exitCode || 1)
        });
      }
      if (action === "error") {
        finish({
          ok: false,
          sha: "",
          mark: "❌",
          exitCode: 1,
          reason: String(packet.reason || "daemon_error")
        });
      }
    });

    ws.on("error", () => {
      finish({
        ok: false,
        sha: "",
        mark: "❌",
        exitCode: 1,
        reason: "daemon_ws_unreachable"
      });
    });

    ws.on("close", () => {
      if (!finished) {
        finish({
          ok: false,
          sha,
          mark,
          exitCode: 1,
          reason: "daemon_ws_closed"
        });
      }
    });
  });
}

async function runProof() {
  const output = vscode.window.createOutputChannel("NeuralShell");
  output.show(true);

  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  const proofView = runProof._proofView;

  if (!editor || !workspace) {
    vscode.window.showWarningMessage("NeuralShell requires an active editor and open workspace.");
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspacePath = workspace.uri.fsPath;
  const selection = extractSelection(editor);
  const relative = path.relative(workspacePath, filePath);

  output.appendLine(`[NeuralShell] Run Proof: ${filePath}`);
  proofView.setState({
    status: "running",
    summary: `Opening diff for ${path.basename(filePath)} and starting proof...`,
    detail: ""
  });

  try {
    const headContent = runGitShow(workspacePath, relative);
    const tempSnapshot = createTempSnapshot(filePath, headContent);
    await vscode.commands.executeCommand(
      "vscode.diff",
      vscode.Uri.file(tempSnapshot),
      editor.document.uri,
      `HEAD ↔ Working Tree (${path.basename(filePath)})`
    );
  } catch (err) {
    output.appendLine(`[NeuralShell] Diff open skipped: ${err && err.message ? err.message : String(err)}`);
  }

  let result = await runProofThroughWs({
    output,
    workspacePath,
    filePath,
    selection,
    proofView
  });

  if (!result.ok && String(result.reason || "").startsWith("daemon_ws")) {
    output.appendLine("[NeuralShell] Local daemon bridge unavailable. Falling back to npm run proof:bundle.");
    const exitCode = await executeProofBundle(workspacePath, output);
    result = {
      ok: exitCode === 0,
      mark: exitCode === 0 ? "✅" : "❌",
      sha: runGitSha(workspacePath),
      exitCode
    };
  }

  const shaShort = String(result.sha || "").slice(0, 12);
  const summaryLine = `[NeuralShell] ${result.mark} proof ${result.ok ? "passed" : "failed"} | SHA ${shaShort || "unknown"}`;
  output.appendLine(summaryLine);
  proofView.setState({
    status: result.ok ? "ok" : "failed",
    summary: result.ok ? "Proof completed successfully." : "Proof failed. Inspect output for details.",
    sha: result.sha || "",
    detail: summaryLine
  });

  if (result.ok) {
    vscode.window.showInformationMessage(`NeuralShell: ${summaryLine}`);
  } else {
    vscode.window.showErrorMessage(`NeuralShell: ${summaryLine}`);
  }
}

function activate(context) {
  const proofView = new ProofViewProvider();
  runProof._proofView = proofView;

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(PROOF_VIEW_ID, proofView)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("neuralshell.runProof", runProof)
  );
}

function deactivate() {
  // no-op
}

module.exports = {
  activate,
  deactivate
};

