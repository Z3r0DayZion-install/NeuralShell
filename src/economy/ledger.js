import fs from 'fs';
import path from 'path';

/**
 * The Ledger (Economic Engine)
 * 
 * Tracks "NeuralCredits" (NC) transactions between agents.
 * Agents must "pay" to use resources (CPU, Storage, Network).
 * Agents "earn" by completing tasks.
 */
export class Ledger {
  constructor(stateFile = 'state/ledger.json') {
    this.balances = new Map();
    this.transactions = [];
    this.stateFile = stateFile;
    this.ensureStateDir();
    this.loadState();
  }

  ensureStateDir() {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.balances = new Map(Object.entries(data.balances || {}));
        this.transactions = data.transactions || [];
        console.log(`[Economy] Loaded ledger state: ${this.balances.size} wallets`);
      } catch (err) {
        console.error('[Economy] Failed to load ledger state:', err);
      }
    }
  }

  saveState() {
    const data = {
      balances: Object.fromEntries(this.balances),
      transactions: this.transactions
    };
    try {
      const tempPath = `${this.stateFile}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.stateFile);
    } catch (err) {
      console.error('[Economy] Failed to save ledger state:', err);
    }
  }

  createWallet(agentId, initialBalance = 100) {
    if (!this.balances.has(agentId)) {
      this.balances.set(agentId, initialBalance);
      console.log(`[Economy] Wallet created for ${agentId}. Balance: ${initialBalance} NC`);
      this.saveState();
    }
  }

  getBalance(agentId) {
    return this.balances.get(agentId) || 0;
  }

  transfer(from, to, amount, reason) {
    if (amount <= 0) {
      throw new Error(`[Economy] Invalid transfer amount: ${amount}. Amount must be positive.`);
    }

    const fromBal = this.getBalance(from);
    if (fromBal < amount) {
      throw new Error(`[Economy] Insufficient funds: ${from} has ${fromBal}, needs ${amount}`);
    }

    this.balances.set(from, fromBal - amount);
    this.balances.set(to, this.getBalance(to) + amount);

    const tx = {
      id: Date.now() + Math.random(),
      from,
      to,
      amount,
      reason,
      timestamp: new Date().toISOString()
    };
    
    this.transactions.push(tx);
    console.log(`[Economy] 💸 ${from} paid ${to} ${amount} NC for "${reason}"`);
    this.saveState();
    return tx;
  }


  getHistory() {
    return this.transactions;
  }
}

// Global Singleton for the local node
export const GlobalLedger = new Ledger();
