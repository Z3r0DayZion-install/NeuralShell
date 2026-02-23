/**
 * THE NEURAL STANDARD
 * 
 * These abstract base classes define the immutable contract for all
 * future extensions of the NeuralShell platform.
 * 
 * Adhering to these contracts ensures forward compatibility.
 */

/**
 * Interface for any entity that can perform work in the Swarm.
 * @interface
 */
export class IAgent {
  /**
   * Unique identifier for the agent
   * @type {string}
   */
  id;

  /**
   * The role this agent fulfills (e.g. 'coder', 'researcher')
   * @type {string}
   */
  role;

  /**
   * Main execution loop. Must handle heartbeat and task polling.
   */
  async start() { throw new Error('Not Implemented'); }

  /**
   * Graceful shutdown.
   */
  async stop() { throw new Error('Not Implemented'); }

  /**
   * Execute a specific unit of work.
   * @param {object} task 
   */
  async executeTask(task) { throw new Error('Not Implemented'); }
}

/**
 * Interface for system extensions.
 * @interface
 */
export class IPlugin {
  /**
   * Name of the plugin
   * @type {string}
   */
  name;

  /**
   * Initialize the plugin with the Router context.
   * @param {object} router 
   */
  async initialize(router) { throw new Error('Not Implemented'); }
}

/**
 * Interface for Vector Memory backends.
 * @interface
 */
export class IMemoryStore {
  async add(text, embedding, metadata) { throw new Error('Not Implemented'); }
  async search(embedding, limit) { throw new Error('Not Implemented'); }
}
