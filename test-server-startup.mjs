import { createServer } from './production-server.js';

console.log('Creating server...');
const server = await createServer({
  configPath: './config.yaml'
});

console.log('Starting server...');
await server.start();
console.log('Server started successfully!');

// Wait a bit then shutdown
setTimeout(async () => {
  console.log('Shutting down...');
  await server.shutdown();
  process.exit(0);
}, 2000);
