import { EvaluationBreakdown, HeuristicWeights, Position, SimpleState } from '../types/game';
import { isSamePos } from '../levels/dungeons';
import { getHeroLegalMoves, getShortestPathDistance } from '../utils/pathfinding';

export const DEFAULT_HEURISTIC_WEIGHTS: HeuristicWeights = {
  catchHero: 60,       // Monster gets +60 for every cell closer to Hero
  delayKey: 35,        // Monster gets +35 for every cell Hero is away from Key
  delayExit: 50,       // Monster gets +50 for every cell Hero is away from Exit
  guardKeyOrExit: 25,  // Monster gets +25 for staying close to active objective
  heroMobility: 20,    // Penalty when Hero has many open escape corridors
};

/**
 * Evaluates a game state from Monster's perspective (MAX player).
 * Higher score = Favorable to Monster.
 * Lower score = Favorable to Hero.
 */
export function evaluateState(
  state: SimpleState,
  weights: HeuristicWeights,
  width: number,
  height: number,
  walls: Position[],
  traps: Position[],
  keyPos: Position,
  exitPos: Position,
  depth: number
): EvaluationBreakdown {
  // 1. Terminal Check: Monster catches Hero
  if (isSamePos(state.hero, state.monster)) {
    const score = 10000 - depth * 10;
    return {
      score,
      distMonsterHero: 0,
      distHeroKey: 0,
      distHeroExit: 0,
      heroMobility: 0,
      isTerminal: true,
      terminalDescription: `TERMINAL: Monster caught Hero! (Score: +${score})`,
      terms: [
        { label: 'Capture Bonus', value: 10000, weight: 1, contribution: 10000 },
        { label: 'Speed Incentive (Depth penalty)', value: -depth * 10, weight: 1, contribution: -depth * 10 },
      ],
    };
  }

  // 2. Terminal Check: Hero stepped on lethal trap
  if (!state.heroAlive) {
    const score = 8000 - depth * 10;
    return {
      score,
      distMonsterHero: 0,
      distHeroKey: 0,
      distHeroExit: 0,
      heroMobility: 0,
      isTerminal: true,
      terminalDescription: `TERMINAL: Hero stepped on trap! (Score: +${score})`,
      terms: [
        { label: 'Trap Elimination Bonus', value: 8000, weight: 1, contribution: 8000 },
        { label: 'Speed Incentive', value: -depth * 10, weight: 1, contribution: -depth * 10 },
      ],
    };
  }

  // 3. Terminal Check: Hero reached Exit with Key
  if (state.hasKey && isSamePos(state.hero, exitPos)) {
    const score = -10000 + depth * 10;
    return {
      score,
      distMonsterHero: 0,
      distHeroKey: 0,
      distHeroExit: 0,
      heroMobility: 0,
      isTerminal: true,
      terminalDescription: `TERMINAL: Hero escaped with Key! (Score: ${score})`,
      terms: [
        { label: 'Escape Penalty (Hero Wins)', value: -10000, weight: 1, contribution: -10000 },
        { label: 'Delay Compensation', value: depth * 10, weight: 1, contribution: depth * 10 },
      ],
    };
  }

  // Non-terminal heuristic evaluation
  const distMonsterHero = getShortestPathDistance(state.monster, state.hero, width, height, walls);
  const distHeroKey = state.hasKey ? 0 : getShortestPathDistance(state.hero, keyPos, width, height, walls);
  const distHeroExit = getShortestPathDistance(state.hero, exitPos, width, height, walls);
  const activeObjective = state.hasKey ? exitPos : keyPos;
  const distMonsterObjective = getShortestPathDistance(state.monster, activeObjective, width, height, walls);

  const heroLegalMoves = getHeroLegalMoves(state, width, height, walls, exitPos);
  const heroMobility = heroLegalMoves.length;

  // Components:
  // Term A: Catch Proximity (shorter monster-hero distance => higher score)
  // Max possible distance on board approx (width + height)
  const maxBoardDist = width + height;
  const proximityAdvantage = (maxBoardDist - distMonsterHero);
  const termCatch = proximityAdvantage * weights.catchHero;

  // Term B: Objective Interception & Denial
  let termKey = 0;
  let termExit = 0;
  let keyStatusPenalty = 0;

  if (!state.hasKey) {
    // Monster wants Hero far from key
    termKey = distHeroKey * weights.delayKey;
  } else {
    // Hero already stole the key! Monster suffers key penalty
    keyStatusPenalty = -800;
    // Monster wants Hero far from exit
    termExit = distHeroExit * weights.delayExit;
  }

  // Term C: Guarding active objective
  const guardAdvantage = (maxBoardDist - distMonsterObjective);
  const termGuard = guardAdvantage * weights.guardKeyOrExit;

  // Term D: Cornering / Limiting Hero Mobility (fewer moves for hero => monster cornering advantage)
  const termMobility = - (heroMobility * weights.heroMobility);

  const totalScore = Math.round(termCatch + termKey + termExit + keyStatusPenalty + termGuard + termMobility);

  const terms = [
    {
      label: 'Hero Pursuit (Proximity)',
      value: proximityAdvantage,
      weight: weights.catchHero,
      contribution: termCatch,
    },
    ...(!state.hasKey ? [{
      label: 'Key Denial (Hero-to-Key distance)',
      value: distHeroKey,
      weight: weights.delayKey,
      contribution: termKey,
    }] : [
      {
        label: 'Key Possession Penalty',
        value: -1,
        weight: 800,
        contribution: keyStatusPenalty,
      },
      {
        label: 'Exit Blockade (Hero-to-Exit distance)',
        value: distHeroExit,
        weight: weights.delayExit,
        contribution: termExit,
      },
    ]),
    {
      label: `Guarding ${state.hasKey ? 'Exit' : 'Key'}`,
      value: guardAdvantage,
      weight: weights.guardKeyOrExit,
      contribution: termGuard,
    },
    {
      label: 'Hero Cornering (Restricting Mobility)',
      value: -heroMobility,
      weight: weights.heroMobility,
      contribution: termMobility,
    },
  ];

  return {
    score: totalScore,
    distMonsterHero,
    distHeroKey,
    distHeroExit,
    heroMobility,
    terms,
    isTerminal: false,
  };
}
