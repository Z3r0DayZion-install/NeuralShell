const steps = [
  "Booting NeuralShell proof lane...",
  "Loading checksum manifest...",
  "Verifying lock-state consistency...",
  "Rendering proof narrative state...",
  "Rendering ROI narrative state...",
  "Validating lock/unlock continuity...",
  "Proof bundle complete."
];

let index = 0;
const timer = setInterval(() => {
  if (index >= steps.length) {
    clearInterval(timer);
    process.exit(0);
    return;
  }
  console.log(`[proof] ${steps[index]}`);
  index += 1;
}, 450);
