const rituals = [
  {
    id: "boot-check",
    title: "Boot Check",
    description: "Run a baseline workstation readiness check."
  },
  {
    id: "focus-sync",
    title: "Focus Sync",
    description: "Align environment state before deep work."
  },
  {
    id: "autonomous-evolution",
    title: "Autonomous Evolution",
    description: "Agent recursively reviews documentation and proposes system upgrades."
  }
];

const scheduled = [];
let autoTriggerCriteria = null;

function getRituals() {
  return rituals;
}

function execute(id) {
  const ritual = rituals.find((item) => item.id === String(id || ""));
  if (!ritual) {
    return { success: false, error: `Unknown ritual: ${id}` };
  }

  return {
    success: true,
    id: ritual.id,
    executedAt: new Date().toISOString()
  };
}

function schedule(id, timestamp) {
  const targetTs = String(timestamp || "").trim();
  const ritual = rituals.find((item) => item.id === String(id || ""));
  if (!ritual) {
    return { success: false, error: `Unknown ritual: ${id}` };
  }

  const row = {
    id: ritual.id,
    timestamp: targetTs || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  scheduled.push(row);
  return { success: true, scheduled: row };
}

function setAutoTrigger(criteria) {
  autoTriggerCriteria =
    criteria && typeof criteria === "object" ? criteria : null;
  return {
    success: true,
    criteria: autoTriggerCriteria
  };
}

function getScheduled() {
  return {
    autoTriggerCriteria,
    entries: scheduled
  };
}

module.exports = {
  getRituals,
  execute,
  schedule,
  setAutoTrigger,
  getScheduled
};
