/**
 * Welcome Workflow - First Launch Experience
 * 
 * Makes NeuralShell undeniable in the first 60 seconds.
 */

const { paranoidShellDemo, airgapDemo, auditDemo } = require('../../demos/paranoid-shell-demo');

class WelcomeWorkflow {
  constructor() {
    this.name = 'WelcomeWorkflow';
    this.version = '1.0.0';
  }

  /**
   * Check if this is first launch
   */
  isFirstLaunch() {
    const state = this.loadState();
    return !state.welcomeCompleted;
  }

  /**
   * Get welcome steps based on system state
   */
  getWelcomeSteps() {
    const steps = [
      {
        id: 'intro',
        title: 'Welcome to NeuralShell',
        subtitle: 'The AI operator shell for paranoid developers',
        content: `**Local-first.** **Hardware-bound.** **Audit-ready.**

NeuralShell is different from cloud AI tools:
• Your data never leaves your machine
• Sessions survive OS reinstalls
• Cryptographically locked to your hardware
• Compliance-ready audit trails

Let's show you what that means.`,
        action: 'next'
      },
      {
        id: 'hardware-check',
        title: '🔐 Hardware Identity',
        subtitle: 'Your sessions are bound to this machine',
        content: `**Checking hardware binding status...**

NeuralShell reads 4 hardware identifiers to create a unique fingerprint:
• CPU serial number
• BIOS UUID
• Baseboard identifier  
• System UUID

This fingerprint encrypts your sessions. Even if someone steals your backup file, they can't open it without your hardware AND passphrase.`,
        action: 'check_hardware',
        demo: paranoidShellDemo
      },
      {
        id: 'ai-setup',
        title: '🤖 AI Provider Setup',
        subtitle: 'Choose how you want to run AI',
        content: `**Two options:**

**1. Local AI (Ollama)** - Free, private, offline
   • Download models once, run forever
   • 100% offline capable
   • Recommended for privacy

**2. Cloud AI** - More powerful models
   • OpenAI GPT-4, Claude, etc.
   • Requires API key
   • Internet required

**Quick Start:** We'll check if Ollama is installed and help you get running.`,
        action: 'setup_ai',
        demo: airgapDemo
      },
      {
        id: 'demo-mode',
        title: '🎮 Interactive Demo',
        subtitle: 'See the "undeniable" features in action',
        content: `**Try these demos:**

**Hardware Binding Demo**
Export a session, "wipe" the app, restore it. See how it only works on YOUR machine.

**Air-Gap Mode**
Disconnect from internet. Watch AI still work locally.

**Audit Trail**
Export a compliance-ready PDF of every AI interaction.

These aren't features you read about - they're features you VERIFY.`,
        action: 'launch_demo',
        demo: auditDemo
      },
      {
        id: 'complete',
        title: '✅ You\'re Ready',
        subtitle: 'NeuralShell is now your hardened AI operator shell',
        content: `**Quick commands to try:**

• \`/help\` - See all available commands
• \`/clear\` - Clear current conversation  
• \`/lock\` - Encrypt and lock this thread
• \`/export\` - Create hardware-bound backup

**Your first session is already hardware-bound and encrypted.**

**Try this:** Type a message, then look for the 🔐 icon in the status bar - that's your hardware binding indicator.

Welcome to paranoid AI.`,
        action: 'complete'
      }
    ];

    return steps;
  }

  /**
   * Mark welcome as completed
   */
  completeWelcome() {
    const state = this.loadState();
    state.welcomeCompleted = true;
    state.welcomeCompletedAt = new Date().toISOString();
    state.welcomeVersion = this.version;
    this.saveState(state);
  }

  loadState() {
    // Placeholder - would integrate with stateManager
    return {};
  }

  saveState(state) {
    // Placeholder - would integrate with stateManager
  }
}

module.exports = { WelcomeWorkflow };
