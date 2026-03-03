import fs from 'fs';
import yaml from 'yaml';
import { calculateQualityScore } from '../../qualityScoring.js';

/**
 * Evolution Engine
 * 
 * Monitors system performance (Quality Scores) and iteratively evolves
 * the configuration (mutates parameters) to maximize global objective functions.
 * 
 * "Survival of the fittest configuration."
 */
export class EvolutionEngine {
  constructor(configPath = './config.yaml') {
    this.configPath = configPath;
    this.history = [];
    this.baselineScore = 0;
    this.isOptimizing = false;
    this.generation = 0;
  }

  async start() {
    console.log('[EvolutionEngine] Starting evolutionary cycle...');
    // In a real system, this would run on a long timer (e.g., every hour)
    // For demo, we'll run a check every 60 seconds
    this.timer = setInterval(() => this.evolve(), 60000);
  }

  async stop() {
    clearInterval(this.timer);
  }

  async evolve() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;
    this.generation++;

    try {
      console.log(`[EvolutionEngine] Generation ${this.generation}: Analyzing fitness...`);
      
      // 1. Measure current performance (mocked fetch from metrics)
      const currentScore = this.measureFitness();
      
      if (this.baselineScore === 0) {
        this.baselineScore = currentScore;
        console.log(`[EvolutionEngine] Baseline established: ${this.baselineScore}`);
        this.isOptimizing = false;
        return;
      }

      // 2. Decide if mutation is needed
      if (currentScore < this.baselineScore || Math.random() > 0.8) {
        console.log('[EvolutionEngine] Triggering mutation to improve score.');
        await this.mutate();
      } else {
        console.log('[EvolutionEngine] System stable. No mutation needed.');
      }

    } catch (err) {
      console.error('[EvolutionEngine] Evolution failed:', err);
    } finally {
      this.isOptimizing = false;
    }
  }

  measureFitness() {
    // In reality, query Prometheus or local metrics state
    // Here we simulate a fluctuating score
    return 70 + Math.random() * 30; 
  }

  async mutate() {
    // Read Config
    const file = fs.readFileSync(this.configPath, 'utf8');
    const config = yaml.parse(file);

    // Select a gene to mutate
    const genes = [
      { path: 'server.requestTimeoutMs', min: 1000, max: 10000, step: 500 },
      { path: 'routing.retryBackoffMs', min: 10, max: 500, step: 10 },
      { path: 'circuitBreaker.failureThreshold', min: 3, max: 20, step: 1 }
    ];

    const gene = genes[Math.floor(Math.random() * genes.length)];
    const parts = gene.path.split('.');
    
    // Navigate to property
    let target = config;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    const prop = parts[parts.length - 1];
    
    // Mutate
    const oldValue = target[prop];
    const direction = Math.random() > 0.5 ? 1 : -1;
    let newValue = oldValue + (gene.step * direction);
    
    // Clamp
    newValue = Math.max(gene.min, Math.min(gene.max, newValue));

    if (newValue !== oldValue) {
      target[prop] = newValue;
      
      // Save atomically
      const newYaml = yaml.stringify(config);
      const tempPath = `${this.configPath}.tmp`;
      fs.writeFileSync(tempPath, newYaml, 'utf8');
      fs.renameSync(tempPath, this.configPath);
      
      console.log(`[EvolutionEngine] MUTATION APPLIED: ${gene.path} ${oldValue} -> ${newValue}`);
      this.history.push({ 
        gen: this.generation, 
        change: `${gene.path}: ${oldValue}->${newValue}`,
        timestamp: new Date()
      });
    }
  }
  
  getHistory() {
    return this.history;
  }
}
