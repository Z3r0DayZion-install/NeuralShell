/**
 * Quality Scoring Module for Decision Intelligence Engine
 * 
 * Calculates quality scores (0-100) for autonomous decisions based on:
 * - Outcome effectiveness (success/failure, impact metrics)
 * - Response time (duration_ms)
 * - Cost impact (if available in context)
 * 
 * Requirements: 4.1, 4.2
 */

import { DecisionEvent } from './types.js';

/**
 * Quality score breakdown showing individual component scores
 */
export interface QualityScoreBreakdown {
  /** Overall quality score (0-100) */
  overall: number;
  
  /** Effectiveness score based on outcome (0-100) */
  effectiveness: number;
  
  /** Response time score based on duration (0-100) */
  responseTime: number;
  
  /** Cost impact score (0-100) */
  costImpact: number;
  
  /** Weights used for calculation */
  weights: {
    effectiveness: number;
    responseTime: number;
    costImpact: number;
  };
}

/**
 * Configuration for quality score calculation
 */
export interface QualityScoringConfig {
  /** Weight for effectiveness component (0-1) */
  effectivenessWeight?: number;
  
  /** Weight for response time component (0-1) */
  responseTimeWeight?: number;
  
  /** Weight for cost impact component (0-1) */
  costImpactWeight?: number;
  
  /** Target response time in milliseconds (for scoring) */
  targetResponseTimeMs?: number;
  
  /** Maximum acceptable response time in milliseconds */
  maxResponseTimeMs?: number;
  
  /** Target cost per decision (for scoring) */
  targetCost?: number;
  
  /** Maximum acceptable cost per decision */
  maxCost?: number;
}

/**
 * Default configuration for quality scoring
 */
const DEFAULT_CONFIG: Required<QualityScoringConfig> = {
  effectivenessWeight: 0.5,      // 50% weight on effectiveness
  responseTimeWeight: 0.3,       // 30% weight on response time
  costImpactWeight: 0.2,         // 20% weight on cost
  targetResponseTimeMs: 100,     // Target: 100ms
  maxResponseTimeMs: 5000,       // Max acceptable: 5 seconds
  targetCost: 0.001,             // Target: $0.001 per decision
  maxCost: 0.1                   // Max acceptable: $0.10 per decision
};

/**
 * Calculates the effectiveness score based on decision outcome
 * 
 * @param event - Decision event to score
 * @returns Effectiveness score (0-100)
 */
function calculateEffectivenessScore(event: DecisionEvent): number {
  const { status, impact } = event.outcome;
  
  // Base score from outcome status
  let baseScore: number;
  switch (status) {
    case 'success':
      baseScore = 100;
      break;
    case 'partial':
      baseScore = 60;
      break;
    case 'failure':
      baseScore = 20;
      break;
    case 'unknown':
      baseScore = 50;
      break;
    default:
      baseScore = 50;
  }
  
  // Adjust based on impact metrics if available
  if (impact && Object.keys(impact).length > 0) {
    // Look for common impact indicators
    const errorRateReduction = impact.error_rate_reduction ?? 0;
    const latencyImprovement = impact.latency_improvement ?? 0;
    const availabilityIncrease = impact.availability_increase ?? 0;
    const problemResolved = impact.problem_resolved ?? 0;
    
    // Calculate impact adjustment (-20 to +20 points)
    let impactAdjustment = 0;
    
    if (errorRateReduction !== 0) {
      // Positive reduction is good, negative is bad
      impactAdjustment += Math.max(-10, Math.min(10, errorRateReduction * 100));
    }
    
    if (latencyImprovement !== 0) {
      // Positive improvement is good
      impactAdjustment += Math.max(-10, Math.min(10, latencyImprovement * 50));
    }
    
    if (availabilityIncrease !== 0) {
      // Positive increase is good
      impactAdjustment += Math.max(-10, Math.min(10, availabilityIncrease * 100));
    }
    
    if (problemResolved === 1) {
      impactAdjustment += 10;
    } else if (problemResolved === 0 && status === 'success') {
      impactAdjustment -= 5;
    }
    
    baseScore += impactAdjustment;
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Calculates the response time score based on decision duration
 * 
 * @param durationMs - Duration in milliseconds
 * @param config - Scoring configuration
 * @returns Response time score (0-100)
 */
function calculateResponseTimeScore(
  durationMs: number,
  config: Required<QualityScoringConfig>
): number {
  const { targetResponseTimeMs, maxResponseTimeMs } = config;
  
  // Perfect score if at or below target
  if (durationMs <= targetResponseTimeMs) {
    return 100;
  }
  
  // Zero score if at or above max
  if (durationMs >= maxResponseTimeMs) {
    return 0;
  }
  
  // Linear interpolation between target and max
  const range = maxResponseTimeMs - targetResponseTimeMs;
  const excess = durationMs - targetResponseTimeMs;
  const score = 100 - (excess / range) * 100;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the cost impact score based on decision cost
 * 
 * @param event - Decision event to score
 * @param config - Scoring configuration
 * @returns Cost impact score (0-100)
 */
function calculateCostImpactScore(
  event: DecisionEvent,
  config: Required<QualityScoringConfig>
): number {
  const { targetCost, maxCost } = config;
  
  // Extract cost from context or impact metrics
  const cost = 
    event.context.metrics.cost ??
    event.outcome.impact.cost ??
    event.context.state.cost ??
    null;
  
  // If no cost data available, return neutral score
  if (cost === null || cost === undefined) {
    return 70; // Neutral score when cost data unavailable
  }
  
  // Perfect score if at or below target
  if (cost <= targetCost) {
    return 100;
  }
  
  // Zero score if at or above max
  if (cost >= maxCost) {
    return 0;
  }
  
  // Linear interpolation between target and max
  const range = maxCost - targetCost;
  const excess = cost - targetCost;
  const score = 100 - (excess / range) * 100;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the overall quality score for a decision event
 * 
 * The score is a weighted combination of:
 * - Effectiveness (50%): Based on outcome status and impact metrics
 * - Response Time (30%): Based on decision duration
 * - Cost Impact (20%): Based on cost metrics if available
 * 
 * @param event - Decision event to score
 * @param config - Optional configuration for scoring parameters
 * @returns Quality score (0-100)
 * 
 * @example
 * ```typescript
 * const event: DecisionEvent = {
 *   // ... event data
 *   outcome: {
 *     status: 'success',
 *     duration_ms: 150,
 *     impact: { error_rate_reduction: 0.5 }
 *   }
 * };
 * 
 * const score = calculateQualityScore(event);
 * console.log(`Quality score: ${score}`); // e.g., 85.5
 * ```
 */
export function calculateQualityScore(
  event: DecisionEvent,
  config: QualityScoringConfig = {}
): number {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Calculate component scores
  const effectivenessScore = calculateEffectivenessScore(event);
  const responseTimeScore = calculateResponseTimeScore(
    event.outcome.duration_ms,
    fullConfig
  );
  const costImpactScore = calculateCostImpactScore(event, fullConfig);
  
  // Calculate weighted overall score
  const overallScore =
    effectivenessScore * fullConfig.effectivenessWeight +
    responseTimeScore * fullConfig.responseTimeWeight +
    costImpactScore * fullConfig.costImpactWeight;
  
  // Ensure score is within bounds and round to 2 decimal places
  return Math.round(Math.max(0, Math.min(100, overallScore)) * 100) / 100;
}

/**
 * Calculates the quality score with detailed breakdown
 * 
 * @param event - Decision event to score
 * @param config - Optional configuration for scoring parameters
 * @returns Quality score breakdown with component scores
 * 
 * @example
 * ```typescript
 * const breakdown = calculateQualityScoreWithBreakdown(event);
 * console.log(`Overall: ${breakdown.overall}`);
 * console.log(`Effectiveness: ${breakdown.effectiveness}`);
 * console.log(`Response Time: ${breakdown.responseTime}`);
 * console.log(`Cost Impact: ${breakdown.costImpact}`);
 * ```
 */
export function calculateQualityScoreWithBreakdown(
  event: DecisionEvent,
  config: QualityScoringConfig = {}
): QualityScoreBreakdown {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Calculate component scores
  const effectivenessScore = calculateEffectivenessScore(event);
  const responseTimeScore = calculateResponseTimeScore(
    event.outcome.duration_ms,
    fullConfig
  );
  const costImpactScore = calculateCostImpactScore(event, fullConfig);
  
  // Calculate weighted overall score
  const overallScore =
    effectivenessScore * fullConfig.effectivenessWeight +
    responseTimeScore * fullConfig.responseTimeWeight +
    costImpactScore * fullConfig.costImpactWeight;
  
  return {
    overall: Math.round(Math.max(0, Math.min(100, overallScore)) * 100) / 100,
    effectiveness: Math.round(effectivenessScore * 100) / 100,
    responseTime: Math.round(responseTimeScore * 100) / 100,
    costImpact: Math.round(costImpactScore * 100) / 100,
    weights: {
      effectiveness: fullConfig.effectivenessWeight,
      responseTime: fullConfig.responseTimeWeight,
      costImpact: fullConfig.costImpactWeight
    }
  };
}

/**
 * Determines if a quality score is considered low (below threshold)
 * 
 * @param score - Quality score to check
 * @param threshold - Threshold for low quality (default: 60)
 * @returns True if score is below threshold
 */
export function isLowQualityScore(score: number, threshold: number = 60): boolean {
  return score < threshold;
}

/**
 * Generates an explanation for a quality score
 * 
 * @param breakdown - Quality score breakdown
 * @returns Human-readable explanation
 */
export function explainQualityScore(breakdown: QualityScoreBreakdown): string {
  const explanations: string[] = [];
  
  // Overall assessment
  if (breakdown.overall >= 80) {
    explanations.push('Excellent decision quality.');
  } else if (breakdown.overall >= 60) {
    explanations.push('Good decision quality.');
  } else if (breakdown.overall >= 40) {
    explanations.push('Moderate decision quality with room for improvement.');
  } else {
    explanations.push('Poor decision quality requiring attention.');
  }
  
  // Component analysis
  if (breakdown.effectiveness < 60) {
    explanations.push(
      `Low effectiveness score (${breakdown.effectiveness.toFixed(1)}) indicates the decision did not achieve desired outcomes.`
    );
  }
  
  if (breakdown.responseTime < 60) {
    explanations.push(
      `Low response time score (${breakdown.responseTime.toFixed(1)}) indicates the decision took too long to execute.`
    );
  }
  
  if (breakdown.costImpact < 60) {
    explanations.push(
      `Low cost impact score (${breakdown.costImpact.toFixed(1)}) indicates the decision was more expensive than expected.`
    );
  }
  
  // Highlight strengths
  const strengths: string[] = [];
  if (breakdown.effectiveness >= 80) strengths.push('effectiveness');
  if (breakdown.responseTime >= 80) strengths.push('response time');
  if (breakdown.costImpact >= 80) strengths.push('cost efficiency');
  
  if (strengths.length > 0) {
    explanations.push(`Strong performance in: ${strengths.join(', ')}.`);
  }
  
  return explanations.join(' ');
}
