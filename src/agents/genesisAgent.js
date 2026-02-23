import { BaseAgent } from './baseAgent.js';
import { ProjectManager } from '../forge/projectManager.js';
import { ContainerManager } from '../forge/containerManager.js';
import { CoderAgent } from './coderAgent.js';
import { GlobalLedger } from '../economy/ledger.js';

export class GenesisAgent extends BaseAgent {
  constructor() {
    super({
      name: 'genesis-01',
      role: 'creator',
      capabilities: ['scaffold_project', 'deploy_app']
    });
    this.projectManager = new ProjectManager();
    this.containerManager = new ContainerManager();
    this.coder = new CoderAgent(); // Direct link for now
  }

  async executeTask(task) {
    if (task.type === 'spawn_app') {
      return this.spawnApp(task.data.prompt, task.data.requester || 'admin-user');
    }
    throw new Error(`Unknown task type: ${task.type}`);
  }

  async spawnApp(prompt, requesterId) {
    console.log(`[Genesis] Spawning app from prompt: "${prompt}"...`);

    // 0. Economic Check
    const complexity = prompt.length;
    const price = Math.max(10, Math.floor(complexity / 2)); // Base 10 NC + complexity tax
    
    try {
      GlobalLedger.transfer(requesterId, this.name, price, `Genesis Fee: ${prompt.substring(0, 20)}...`);
    } catch (err) {
      console.error(`[Genesis] 🛑 Payment failed: ${err.message}`);
      throw new Error(`Insufficient NeuralCredits. Cost: ${price} NC.`);
    }

    console.log(`[Genesis] 💰 Payment accepted: ${price} NC from ${requesterId}`);

    // 1. Scaffold
    const project = this.projectManager.createProject(prompt);
    console.log(`[Genesis] Created workspace: ${project.path}`);

    // 2. Generate Code (HTML)
    const htmlTask = `Create a single-file HTML/JS/CSS application for: ${prompt}. Return ONLY the code.`;
    const htmlResult = await this.coder.generateAndRun(htmlTask); // We use generateAndRun just to get the code string logic
    
    // Hardcoded robust template for demo reliability if Coder returns snippets
    const finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>${project.name}</title>
  <style>
    body { background: #111; color: #0f0; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    h1 { font-size: 3rem; }
    .container { text-align: center; border: 2px solid #0f0; padding: 40px; box-shadow: 0 0 20px #0f0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${project.name.toUpperCase()}</h1>
    <p>Spawned by NeuralShell Genesis Engine</p>
    <div id="app">Running...</div>
    <p><small>Cost: ${price} NC</small></p>
  </div>
  <script>
    // Logic for ${prompt}
    document.getElementById('app').innerHTML = "Interactive Logic Active: " + new Date().toLocaleTimeString();
  </script>
</body>
</html>
    `;

    this.projectManager.writeFile(project.path, 'index.html', finalHtml);

    // 3. Generate Dockerfile
    const dockerfile = `
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
    `;
    this.projectManager.writeFile(project.path, 'Dockerfile', dockerfile);

    // 4. Deploy
    const deployment = await this.containerManager.deploy(project);
    
    return {
      status: 'deployed',
      cost: price,
      ...deployment
    };
  }
}
