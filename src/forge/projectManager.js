import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Project Manager
 * 
 * Manages the file systems for AI-generated applications.
 * Acts as the "Disk Drive" for the Genesis Engine.
 */
export class ProjectManager {
  constructor(baseDir = './deployments') {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  createProject(name) {
    const id = crypto.randomUUID().slice(0, 8);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const projectDir = path.join(this.baseDir, `${safeName}-${id}`);
    
    fs.mkdirSync(projectDir, { recursive: true });
    
    return {
      id,
      name: safeName,
      path: projectDir,
      url: null // Assigned later
    };
  }

  writeFile(projectPath, filename, content) {
    const absoluteProjectDir = path.resolve(projectPath);
    const fullPath = path.resolve(absoluteProjectDir, filename);
    const absoluteBaseDir = path.resolve(this.baseDir);

    // Security Check: Path Traversal
    if (!fullPath.startsWith(absoluteBaseDir)) {
      console.error(`[ProjectManager] Blocked attempt to write outside base directory: ${fullPath}`);
      throw new Error('Access denied: Path outside project base directory');
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  listProjects() {
    return fs.readdirSync(this.baseDir).map(name => {
      const dir = path.join(this.baseDir, name);
      // Basic metadata reading could go here
      return { name, path: dir };
    });
  }
}
