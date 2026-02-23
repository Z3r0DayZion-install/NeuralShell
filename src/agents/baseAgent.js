import { MessageBus } from '../swarm/messageBus.js';
import { GlobalLedger } from '../economy/ledger.js';

export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'unnamed-agent';
    this.role = config.role || 'worker';
    this.capabilities = config.capabilities || [];
    this.bus = new MessageBus();
    this.isRunning = false;
    
    // Economic Identity
    GlobalLedger.createWallet(this.name, 1000); // Initial grant
  }

  async pay(recipient, amount, reason) {
    try {
      GlobalLedger.transfer(this.name, recipient, amount, reason);
      return true;
    } catch (err) {
      console.error(`[Agent:${this.name}] Payment failed:`, err.message);
      return false;
    }
  }

  async charge(amount, task) {
    // Helper to calculate cost based on task complexity
    return amount; 
  }

  async start() {
    await this.bus.connect(this.name);
    this.isRunning = true;
    console.log(`[Agent:${this.name}] Online. Role: ${this.role}`);
    
    // Announce presence
    await this.bus.publish('swarm:heartbeat', {
      name: this.name,
      role: this.role,
      status: 'online'
    });

    this.processLoop();
  }

  async stop() {
    this.isRunning = false;
    await this.bus.publish('swarm:heartbeat', {
      name: this.name,
      role: this.role,
      status: 'offline'
    });
    await this.bus.disconnect();
  }

  async processLoop() {
    while (this.isRunning) {
      try {
        // Wait for tasks targeted at this role
        const task = await this.bus.waitForTask(this.role, 5).catch(err => {
           console.warn(`[Agent:${this.name}] Connection jitter: ${err.message}`);
           return null;
        }); // 5s timeout to allow heartbeat
        
        if (task) {
          console.log(`[Agent:${this.name}] Received task: ${task.type}`);
          await this.bus.publish('task:started', { taskId: task.id, agent: this.name });
          
          try {
            const result = await this.executeTask(task);
            await this.bus.publish('task:completed', { 
              taskId: task.id, 
              agent: this.name,
              result 
            });
          } catch (err) {
            console.error(`[Agent:${this.name}] Task failed:`, err);
            await this.bus.publish('task:failed', { 
              taskId: task.id, 
              agent: this.name,
              error: err.message 
            });
          }
        }
        
        // Send heartbeat
        // (In a real system, this would be on a separate timer)
      } catch (err) {
        if (this.isRunning) console.error(`[Agent:${this.name}] Loop error:`, err);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Override this in subclasses
  async executeTask(task) {
    throw new Error('executeTask not implemented');
  }
}
