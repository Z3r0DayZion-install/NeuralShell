import { ResearcherAgent } from '../agents/researcherAgent.js';
import { CoderAgent } from '../agents/coderAgent.js';
import { SelfAwareAgent } from '../agents/selfAwareAgent.js';
import { DreamerAgent } from '../agents/dreamerAgent.js';

/**
 * Swarm Bootstrapper
 * Launches the autonomous agents in the background.
 */
export async function bootstrapSwarm(routerCore) {
  console.log('[Swarm] Bootstrapping agents...');

  const researcher = new ResearcherAgent();
  const coder = new CoderAgent();
  const architect = new SelfAwareAgent(routerCore);
  const dreamer = new DreamerAgent();

  try {
    // Start agents with Supervisor
    const agents = [researcher, coder, architect, dreamer];

    agents.forEach(agent => {
      const startAgent = async () => {
        try {
          await agent.start();
        } catch (err) {
          console.error(`[Supervisor] ${agent.name} crashed. Restarting in 5s...`, err);
          setTimeout(startAgent, 5000);
        }
      };

      // Monitor loop check
      setInterval(() => {
        if (!agent.isRunning) {
          console.warn(`[Supervisor] Detected ${agent.name} is down. Reviving...`);
          startAgent();
        }
      }, 10000);

      startAgent();
    });

    console.log('[Swarm] Agents launched (Supervisor Active).');
    return { researcher, coder, architect, dreamer };
  } catch (err) {
    console.error('[Swarm] Bootstrap failed:', err);
  }
}
