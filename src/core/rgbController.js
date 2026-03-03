function colorForMood(mood) {
  switch (String(mood || "").toLowerCase()) {
    case "focused":
      return { r: 0, g: 180, b: 255 };
    case "critical":
      return { r: 255, g: 40, b: 40 };
    case "caution":
      return { r: 255, g: 170, b: 0 };
    default:
      return { r: 60, g: 60, b: 60 };
  }
}

class RgbController {
  constructor() {
    this.settings = {};
    this.lastMood = "idle";
    this.lastColor = colorForMood("idle");
  }

  configure(settings) {
    this.settings = settings && typeof settings === "object" ? { ...settings } : {};
    return this.settings;
  }

  sendOpenRgbColor(color) {
    this.lastColor = {
      r: Number(color.r) || 0,
      g: Number(color.g) || 0,
      b: Number(color.b) || 0
    };
    return {
      ok: true,
      provider: "openrgb",
      color: this.lastColor
    };
  }

  async applyMood(mood, personality) {
    this.lastMood = String(mood || "idle");
    const result = this.sendOpenRgbColor(colorForMood(this.lastMood));
    return {
      ok: true,
      mood: this.lastMood,
      personality: String(personality || "balanced"),
      ...result
    };
  }

  getStatus() {
    return {
      ok: true,
      mood: this.lastMood,
      color: this.lastColor,
      enabled: Boolean(this.settings.rgbEnabled)
    };
  }
}

module.exports = new RgbController();
module.exports.RgbController = RgbController;
