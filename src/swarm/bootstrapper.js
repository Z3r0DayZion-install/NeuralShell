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
    const supervisorIntervals = [];
    const restartTimeouts = [];
    let stopping = false;

    agents.forEach(agent => {
      const startAgent = async () => {
        if (stopping) {
          return;
        }
        try {
          await agent.start();
        } catch (err) {
          console.error(`[Supervisor] ${agent.name} crashed. Restarting in 5s...`, err);
          const t = setTimeout(startAgent, 5000);
          restartTimeouts.push(t);
        }
      };

      // Monitor loop check
      const interval = setInterval(() => {
        if (!agent.isRunning) {
          console.warn(`[Supervisor] Detected ${agent.name} is down. Reviving...`);
          startAgent();
        }
      }, 10000);
      supervisorIntervals.push(interval);

      startAgent();
    });

    console.log('[Swarm] Agents launched (Supervisor Active).');
    return {
      researcher,
      coder,
      architect,
      dreamer,
      async stop() {
        stopping = true;
        supervisorIntervals.forEach((i) => clearInterval(i));
        restartTimeouts.forEach((t) => clearTimeout(t));
        await Promise.all(agents.map((a) => a.stop().catch(() => {})));
      }
    };
  } catch (err) {
    console.error('[Swarm] Bootstrap failed:', err);
  }
}
