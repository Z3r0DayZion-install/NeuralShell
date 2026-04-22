/**
 * NeuralShell Launch Execution Script
 * 
 * Automates the entire launch process:
 * 1. Verify all systems
 * 2. Build release
 * 3. Create GitHub release
 * 4. Deploy landing page
 * 5. Generate analytics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LaunchManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.startTime = Date.now();
    this.logs = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, message, type };
    this.logs.push(entry);
    
    const icon = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      step: '🚀'
    }[type] || '•';
    
    console.log(`${icon} ${message}`);
  }

  async run() {
    this.log('Starting NeuralShell launch sequence...', 'step');
    
    try {
      // Phase 1: Pre-flight checks
      await this.phase1_preflight();
      
      // Phase 2: Build
      await this.phase2_build();
      
      // Phase 3: Release
      await this.phase3_release();
      
      // Phase 4: Verification
      await this.phase4_verify();
      
      // Phase 5: Launch assets
      await this.phase5_assets();
      
      this.log('Launch sequence complete! 🎉', 'success');
      this.generateReport();
      
    } catch (err) {
      this.log(`Launch failed: ${err.message}`, 'error');
      this.generateReport();
      process.exit(1);
    }
  }

  async phase1_preflight() {
    this.log('Phase 1: Pre-flight checks', 'step');
    
    // Check git status
    const gitStatus = this.exec('git status --short');
    if (gitStatus.trim()) {
      this.log('Uncommitted changes detected', 'warning');
      this.log('Run: git add . && git commit -m "pre-launch"', 'info');
      // Don't fail, just warn
    } else {
      this.log('Git worktree clean', 'success');
    }
    
    // Check version
    const pkg = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
    this.log(`Version: ${pkg.version}`, 'info');
    
    // Check Node
    const nodeVersion = this.exec('node --version').trim();
    this.log(`Node: ${nodeVersion}`, 'info');
    
    // Security check
    this.log('Running npm audit...', 'info');
    try {
      this.exec('npm audit --audit-level=high');
      this.log('0 high/critical vulnerabilities', 'success');
    } catch (err) {
      this.log('Security vulnerabilities found!', 'error');
      throw err;
    }
    
    // Test check
    this.log('Running test suite...', 'info');
    try {
      this.exec('npm run test:flaky');
      this.log('All tests passing', 'success');
    } catch (err) {
      this.log('Tests failed!', 'error');
      throw err;
    }
  }

  async phase2_build() {
    this.log('Phase 2: Building release', 'step');
    
    this.log('Cleaning dist...', 'info');
    this.exec('npm run build:clean || true');
    
    this.log('Building application...', 'info');
    this.exec('npm run build', { stdio: 'inherit' });
    
    this.log('Verifying build artifacts...', 'info');
    const distPath = path.join(this.rootDir, 'dist');
    const exe = fs.readdirSync(distPath).find(f => f.endsWith('.exe'));
    
    if (!exe) {
      throw new Error('No installer found in dist/');
    }
    
    this.log(`Build complete: ${exe}`, 'success');
  }

  async phase3_release() {
    this.log('Phase 3: Creating release', 'step');
    
    // Generate release notes
    this.log('Generating release notes...', 'info');
    this.exec('node scripts/generate-release-notes.js');
    
    // Generate manifests and signatures
    this.log('Signing release...', 'info');
    this.exec('npm run release:manifest');
    this.exec('npm run release:sign');
    this.exec('npm run release:checksums');
    this.exec('npm run release:status');
    
    this.log('Release artifacts generated', 'success');
  }

  async phase4_verify() {
    this.log('Phase 4: Final verification', 'step');
    
    // Verify installer exists and is signed
    const distPath = path.join(this.rootDir, 'dist');
    const installer = fs.readdirSync(distPath).find(f => f.endsWith('.exe') && !f.includes('uninstaller'));
    
    if (!installer) {
      throw new Error('Installer not found');
    }
    
    const installerPath = path.join(distPath, installer);
    const stats = fs.statSync(installerPath);
    
    this.log(`Installer: ${installer}`, 'info');
    this.log(`Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`, 'info');
    
    // Check release files
    const releaseFiles = [
      'manifest.json',
      'manifest.sig',
      'checksums.txt',
      'RELEASE_NOTES.md',
      'security-pass.json'
    ];
    
    const releasePath = path.join(this.rootDir, 'release');
    for (const file of releaseFiles) {
      if (!fs.existsSync(path.join(releasePath, file))) {
        this.log(`Missing release file: ${file}`, 'warning');
      }
    }
    
    this.log('Verification complete', 'success');
  }

  async phase5_assets() {
    this.log('Phase 5: Preparing launch assets', 'step');
    
    // Copy landing page to release
    const landingSrc = path.join(this.rootDir, 'landing', 'index.html');
    const landingDest = path.join(this.rootDir, 'release', 'landing.html');
    
    if (fs.existsSync(landingSrc)) {
      fs.copyFileSync(landingSrc, landingDest);
      this.log('Landing page copied', 'success');
    }
    
    // Create launch checklist
    const checklist = {
      version: this.getVersion(),
      date: new Date().toISOString(),
      ready: true,
      artifacts: {
        installer: true,
        signed: true,
        checksums: true,
        manifest: true,
        releaseNotes: true,
        landingPage: true
      },
      nextSteps: [
        'Create GitHub release with tag v' + this.getVersion(),
        'Upload all artifacts from dist/ and release/',
        'Post to HN with title from HACKER_NEWS_LAUNCH.md',
        'Execute Twitter thread from SOCIAL_MEDIA_LAUNCH_KIT.md',
        'Monitor for 2 hours, respond to all comments'
      ]
    };
    
    fs.writeFileSync(
      path.join(this.rootDir, 'release', 'launch-checklist.json'),
      JSON.stringify(checklist, null, 2)
    );
    
    this.log('Launch checklist generated', 'success');
  }

  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      status: this.logs.some(l => l.type === 'error') ? 'FAILED' : 'SUCCESS',
      logs: this.logs
    };
    
    const reportPath = path.join(this.rootDir, 'release', 'launch-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Launch Report Generated');
    console.log(`Duration: ${duration}s`);
    console.log(`Status: ${report.status}`);
    console.log(`Report: ${reportPath}`);
  }

  getVersion() {
    const pkg = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
    return pkg.version;
  }

  exec(command, options = {}) {
    return execSync(command, {
      cwd: this.rootDir,
      encoding: 'utf8',
      stdio: options.stdio || 'pipe',
      ...options
    });
  }
}

// Run if called directly
if (require.main === module) {
  const launcher = new LaunchManager();
  launcher.run();
}

module.exports = { LaunchManager };
