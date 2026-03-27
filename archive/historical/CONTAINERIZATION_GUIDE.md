# NeuralShell Containerization

Your project has been containerized with Docker following best practices.

## Files Created

- **Dockerfile** – Multi-stage build optimized for Node.js/Electron
- **docker-compose.yml** – Development and Ollama backend setup
- **.dockerignore** – Excludes unnecessary files from build context

## Quick Start

### Build the image
```bash
docker build -t neuralshell:latest .
```

### Run with docker-compose (includes Ollama backend)
```bash
docker compose up
```

This starts:
- **NeuralShell** on port 3000
- **Ollama** backend on port 11434 (for LLM inference)

### Run standalone
```bash
docker run -d --name neuralshell -p 3000:3000 neuralshell:latest
```

## Development Workflow

With `docker-compose.yml`, source files are bind-mounted for live reload:
- Edit `./src`, `./assets` locally
- Changes reflect in the running container immediately
- State and logs persist in volumes

## Best Practices Applied

✅ **Multi-stage builds** – Separates build dependencies from runtime  
✅ **Minimal runtime image** – Only production dependencies included  
✅ **Non-root user** – Container runs as `nodejs` (UID 1001) for security  
✅ **Proper layer caching** – Package.json copied before source code  
✅ **BuildKit cache mounts** – `apt` caches don't bloat layers  
✅ **Optimized .dockerignore** – Excludes node_modules, logs, dist, git  
✅ **Health checks** – Container status monitored via npm scripts  

## Image Details

- **Base**: Debian Bullseye Slim (node:22.12.0)
- **Size**: ~433 MB (compressed), ~1.78 GB (uncompressed)
- **Node version**: 22.12.0
- **Architecture**: linux/amd64

## Running Tests

```bash
docker run --rm neuralshell:latest npm test
```

## Debugging

### View logs
```bash
docker logs neuralshell-app
```

### Exec into container
```bash
docker exec -it neuralshell-app /bin/bash
```

### Inspect image
```bash
docker inspect neuralshell:latest
```

## Production Notes

For production deployments:
- Remove the Ollama service from docker-compose.yml or use an external backend
- Pin specific Node/image versions in Dockerfile
- Consider using Docker Swarm or Kubernetes for orchestration
- Enable restart policies: `restart_policy: unless-stopped`
- Set resource limits on containers
- Use environment-based configuration instead of hardcoded values

Let me know if you have any other questions!
