import Docker from 'dockerode';
import getPort from 'get-port';
import path from 'path';
import tar from 'tar-fs';

/**
 * Container Manager (The Deployer)
 * 
 * dynamically builds and runs Docker containers for generated projects.
 * It's a mini-Heroku running inside your router.
 */
export class ContainerManager {
  constructor() {
    this.docker = new Docker();
    this.activeContainers = new Map();
  }

  async deploy(project) {
    console.log(`[Forge] Deploying ${project.name}...`);
    
    // 1. Find free port
    const port = await getPort({ port: getPort.makeRange(8000, 9000) });
    const imageName = `neuralshell-app-${project.name}:${project.id}`;

    try {
      // 2. Build Image
      console.log(`[Forge] Building image ${imageName}...`);
      const stream = await this.docker.buildImage({
        context: project.path,
        src: ['.']
      }, { t: imageName });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
      });

      // 3. Run Container
      console.log(`[Forge] Starting container on port ${port}...`);
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `ns-app-${project.id}`,
        HostConfig: {
          PortBindings: {
            '80/tcp': [{ HostPort: String(port) }] // Assuming apps expose 80
          },
          AutoRemove: true // Cleanup on stop
        }
      });

      await container.start();
      
      const appInfo = {
        id: project.id,
        name: project.name,
        port,
        url: `http://localhost:${port}`,
        containerId: container.id
      };

      this.activeContainers.set(project.id, appInfo);
      return appInfo;

    } catch (err) {
      console.error('[Forge] Deployment failed:', err);
      throw err;
    }
  }

  async stop(id) {
    if (this.activeContainers.has(id)) {
      const info = this.activeContainers.get(id);
      const container = this.docker.getContainer(info.containerId);
      await container.stop();
      this.activeContainers.delete(id);
      return true;
    }
    return false;
  }

  listActive() {
    return Array.from(this.activeContainers.values());
  }
}
