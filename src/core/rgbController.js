const net = require("net");

const MOOD_COLORS = {
  calm: { r: 40, g: 180, b: 255 },
  focused: { r: 90, g: 220, b: 120 },
  creative: { r: 255, g: 120, b: 190 },
  caution: { r: 255, g: 180, b: 60 },
  critical: { r: 255, g: 70, b: 70 },
  idle: { r: 120, g: 130, b: 160 }
};

function clampByte(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.floor(n)));
}

function withPersonalityBias(color, personality) {
  const base = {
    r: clampByte(color.r),
    g: clampByte(color.g),
    b: clampByte(color.b)
  };
  switch (String(personality || "balanced").toLowerCase()) {
    case "engineer":
      return { r: clampByte(base.r * 0.8), g: clampByte(base.g * 1.1), b: clampByte(base.b * 1.1) };
    case "founder":
      return { r: clampByte(base.r * 1.1), g: clampByte(base.g * 0.95), b: clampByte(base.b * 0.9) };
    case "analyst":
      return { r: clampByte(base.r * 0.85), g: clampByte(base.g * 0.95), b: clampByte(base.b * 1.15) };
    case "creative":
      return { r: clampByte(base.r * 1.1), g: clampByte(base.g * 0.85), b: clampByte(base.b * 1.1) };
    default:
      return base;
  }
}

class RgbController {
  constructor() {
    this.enabled = false;
    this.provider = "none";
    this.openRgbHost = "127.0.0.1";
    this.openRgbPort = 6742;
    this.targets = [];
    this.lastMood = "idle";
    this.lastPersonality = "balanced";
    this.lastColor = { ...MOOD_COLORS.idle };
    this.lastError = "";
  }

  configure(settings = {}) {
    this.enabled = Boolean(settings.rgbEnabled);
    this.provider = String(settings.rgbProvider || "none").toLowerCase();
    this.openRgbHost = String(settings.rgbHost || "127.0.0.1");
    this.openRgbPort = Number(settings.rgbPort) || 6742;
    this.targets = Array.isArray(settings.rgbTargets)
      ? settings.rgbTargets.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 50)
      : [];
  }

  getStatus() {
    return {
      enabled: this.enabled,
      provider: this.provider,
      host: this.openRgbHost,
      port: this.openRgbPort,
      targets: this.targets,
      mood: this.lastMood,
      personality: this.lastPersonality,
      color: this.lastColor,
      lastError: this.lastError || ""
    };
  }

  async applyMood(mood, personality) {
    this.lastMood = String(mood || "idle").toLowerCase();
    this.lastPersonality = String(personality || "balanced").toLowerCase();
    const baseColor = MOOD_COLORS[this.lastMood] || MOOD_COLORS.idle;
    const color = withPersonalityBias(baseColor, this.lastPersonality);
    this.lastColor = color;

    if (!this.enabled || this.provider === "none") {
      return { ok: true, simulated: true, color, targets: this.targets };
    }

    if (this.provider === "openrgb") {
      try {
        await this.sendOpenRgbColor(color);
        this.lastError = "";
        return { ok: true, color, targets: this.targets };
      } catch (err) {
        this.lastError = err && err.message ? err.message : String(err);
        return { ok: false, color, error: this.lastError, targets: this.targets };
      }
    }

    return { ok: true, simulated: true, color, targets: this.targets };
  }

  async sendOpenRgbColor(color) {
    const payload = JSON.stringify({
      type: "set_color",
      mode: "global",
      targets: this.targets,
      timestamp: Date.now(),
      color: {
        r: clampByte(color.r),
        g: clampByte(color.g),
        b: clampByte(color.b)
      }
    });

    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let settled = false;
      const done = (fn, arg) => {
        if (settled) return;
        settled = true;
        try {
          socket.destroy();
        } catch {
          // ignore cleanup errors
        }
        fn(arg);
      };

      socket.setTimeout(1500);
      socket.once("timeout", () => done(reject, new Error("OpenRGB timeout")));
      socket.once("error", (err) => done(reject, err));
      socket.connect(this.openRgbPort, this.openRgbHost, () => {
        socket.write(payload, "utf8", () => done(resolve));
      });
    });
  }
}

module.exports = new RgbController();
