const { spawnSync } = require("node:child_process");

function probeNvidia() {
  const result = spawnSync("nvidia-smi", ["--query-gpu=name", "--format=csv,noheader"], {
    shell: false,
    windowsHide: true,
    encoding: "utf8"
  });
  if (result.status !== 0) return "";
  return String(result.stdout || "").trim().split(/\r?\n/)[0] || "";
}

function getAccelStatus() {
  const platform = process.platform;
  const nvidiaName = probeNvidia();
  if (nvidiaName) {
    return {
      enabled: true,
      backend: "cuda",
      device: nvidiaName
    };
  }
  if (platform === "darwin") {
    return {
      enabled: true,
      backend: "metal",
      device: "Apple GPU"
    };
  }
  return {
    enabled: false,
    backend: "cpu",
    device: ""
  };
}

module.exports = {
  getAccelStatus
};
