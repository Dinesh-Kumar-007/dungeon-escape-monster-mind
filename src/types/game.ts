export type CellType = 'empty' | 'wall' | 'trap' | 'key' | 'exit';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'WAIT';

export interface Position {
  x: number;
  y: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  walls: Position[];
  traps: Position[];
  heroStart: Position;
  monsterStart: Position;
  keyPos: Position;
  exitPos: Position;
}

export interface HeuristicWeights {
  catchHero: number;        // Weight for minimizing distance between monster and hero
  delayKey: number;          // Weight for maximizing hero's distance to key
  delayExit: number;         // Weight for maximizing hero's distance to exit
  guardKeyOrExit: number;    // Weight for monster staying between hero and objective
  heroMobility: number;      // Penalty for hero having many safe legal moves
}

export interface SimpleState {
  hero: Position;
  monster: Position;
  hasKey: boolean;
  heroAlive: boolean;
}

export interface EvaluationBreakdown {
  score: number;
  distMonsterHero: number;
  distHeroKey: number;
  distHeroExit: number;
  heroMobility: number;
  terms: {
    label: string;
    value: number;
    weight: number;
    contribution: number;
  }[];
  isTerminal: boolean;
  terminalDescription?: string;
}

export interface SearchNode {
  id: string;
  parentId: string | null;
  depth: number;
  isMax: boolean; // true = Monster (MAX), false = Hero (MIN)
  state: SimpleState;
  move: Direction | null;
  alpha: number;
  beta: number;
  value: number | null; // Minimax / heuristic score
  staticEval?: number;
  isLeaf: boolean;
  isTerminal: boolean;
  terminalReason?: string;
  isPruned: boolean;
  pruneReason?: string;
  childIds: string[];
  bestChildId: string | null;
  heuristicBreakdown?: EvaluationBreakdown;
  // Layout coordinates for SVG rendering
  x?: number;
  y?: number;
}

export type TraceStepType =
  | 'ENTER_NODE'
  | 'EVALUATE_LEAF'
  | 'CHILD_RETURN'
  | 'UPDATE_BOUNDS'
  | 'PRUNE_BRANCH'
  | 'BACKUP_VALUE';

export interface TraceStep {
  stepIndex: number;
  type: TraceStepType;
  nodeId: string;
  depth: number;
  isMax: boolean;
  alpha: number;
  beta: number;
  currentVal: number | null;
  returnedVal?: number;
  move?: Direction | null;
  explanation: string;
  pseudocodeLine: number;
}

export type NavigationSection =
  | 'arena'
  | 'lab'
  | 'tree'
  | 'debugger'
  | 'heuristics'
  | 'performance';

export type MoveOrderingStrategy = 'heuristic' | 'natural' | 'reverse';

export interface AlgorithmStats {
  totalNodesExplored: number;
  totalNodesPruned: number;
  nodesEvaluated: number;
  nodesExpanded: number;
  unprunedEquivalentNodes: number;
  alphaCutoffs: number;
  betaCutoffs: number;
  executionTimeMs: number;
  bestMove: Direction;
  bestValue: number;
  searchDepth: number;
  moveOrdering?: MoveOrderingStrategy;
}

export interface SearchResult {
  bestMove: Direction;
  bestValue: number;
  rootId: string;
  nodes: Record<string, SearchNode>;
  trace: TraceStep[];
  stats: AlgorithmStats;
}

export interface GameState {
  levelId: string;
  width: number;
  height: number;
  grid: CellType[][];
  hero: Position;
  monster: Position;
  keyPos: Position | null;
  exitPos: Position;
  hasKey: boolean;
  turn: 'hero' | 'monster';
  turnCount: number;
  isGameOver: boolean;
  winner: 'hero' | 'monster' | null;
  gameOverReason: string | null;
  lastMonsterMove: Direction | null;
}
