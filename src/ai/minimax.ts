import {
  AlgorithmStats,
  Direction,
  HeuristicWeights,
  MoveOrderingStrategy,
  Position,
  SearchResult,
  SearchNode,
  SimpleState,
  TraceStep,
} from '../types/game';
import { evaluateState } from './evaluation';
import { applyMove, getHeroLegalMoves, getMonsterLegalMoves } from '../utils/pathfinding';
import { isSamePos } from '../levels/dungeons';

export interface MinimaxOptions {
  depth: number;
  weights: HeuristicWeights;
  width: number;
  height: number;
  walls: Position[];
  traps: Position[];
  keyPos: Position;
  exitPos: Position;
  moveOrdering?: MoveOrderingStrategy;
}

/**
 * Minimax with Alpha-Beta Pruning implementation.
 * Builds the actual execution tree and step-by-step trace for educational inspection.
 */
export function runAlphaBetaSearch(
  initialState: SimpleState,
  options: MinimaxOptions
): SearchResult {
  const startTime = performance.now();
  const nodes: Record<string, SearchNode> = {};
  const trace: TraceStep[] = [];
  const moveOrdering: MoveOrderingStrategy = options.moveOrdering || 'heuristic';

  let nodeCounter = 0;
  let alphaCutoffs = 0;
  let betaCutoffs = 0;
  let totalNodesExplored = 0;
  let totalNodesPruned = 0;
  let nodesEvaluated = 0;
  let nodesExpanded = 0;

  // Root node (Monster's turn = MAX player)
  const rootId = 'node_0';
  nodeCounter++;

  const rootNode: SearchNode = {
    id: rootId,
    parentId: null,
    depth: 0,
    isMax: true,
    state: initialState,
    move: null,
    alpha: -Infinity,
    beta: Infinity,
    value: null,
    isLeaf: false,
    isTerminal: false,
    isPruned: false,
    childIds: [],
    bestChildId: null,
  };
  nodes[rootId] = rootNode;

  function recordStep(
    type: TraceStep['type'],
    nodeId: string,
    explanation: string,
    codeLine: number,
    extra: Partial<TraceStep> = {}
  ) {
    const node = nodes[nodeId];
    trace.push({
      stepIndex: trace.length,
      type,
      nodeId,
      depth: node.depth,
      isMax: node.isMax,
      alpha: node.alpha,
      beta: node.beta,
      currentVal: node.value,
      move: node.move,
      explanation,
      pseudocodeLine: codeLine,
      ...extra,
    });
  }

  function orderMoves(moves: Direction[], state: SimpleState, isMax: boolean): Direction[] {
    if (moveOrdering === 'natural') {
      return [...moves];
    }
    const sorted = [...moves].sort((a, b) => {
      const sA = applyMove(state, a, isMax, options.keyPos, options.traps);
      const sB = applyMove(state, b, isMax, options.keyPos, options.traps);
      const distA = Math.abs(sA.monster.x - sA.hero.x) + Math.abs(sA.monster.y - sA.hero.y);
      const distB = Math.abs(sB.monster.x - sB.hero.x) + Math.abs(sB.monster.y - sB.hero.y);
      if (isMax) {
        return distA - distB; // Monster prefers moves closing distance to hero first
      } else {
        return distB - distA; // Hero prefers moves increasing distance from monster first
      }
    });

    if (moveOrdering === 'reverse') {
      return sorted.reverse();
    }
    return sorted;
  }

  // Recursive search
  function minimax(
    nodeId: string,
    depthRemaining: number,
    alpha: number,
    beta: number,
    isMax: boolean
  ): number {
    const node = nodes[nodeId];
    totalNodesExplored++;
    node.alpha = alpha;
    node.beta = beta;

    recordStep(
      'ENTER_NODE',
      nodeId,
      `Visiting ${isMax ? 'MAX (Monster)' : 'MIN (Hero)'} node at Depth ${node.depth}. Search window: [α = ${formatNum(alpha)}, β = ${formatNum(beta)}].`,
      isMax ? 2 : 11
    );

    // 1. Check Terminal Conditions
    const isMonsterOnHero = isSamePos(node.state.monster, node.state.hero);
    const isHeroDead = !node.state.heroAlive;
    const isHeroEscaped = node.state.hasKey && isSamePos(node.state.hero, options.exitPos);

    if (isMonsterOnHero || isHeroDead || isHeroEscaped || depthRemaining === 0) {
      node.isLeaf = true;
      node.isTerminal = isMonsterOnHero || isHeroDead || isHeroEscaped;
      nodesEvaluated++;

      const evalResult = evaluateState(
        node.state,
        options.weights,
        options.width,
        options.height,
        options.walls,
        options.traps,
        options.keyPos,
        options.exitPos,
        node.depth
      );

      node.staticEval = evalResult.score;
      node.value = evalResult.score;
      node.heuristicBreakdown = evalResult;

      if (node.isTerminal) {
        node.terminalReason = evalResult.terminalDescription;
      }

      recordStep(
        'EVALUATE_LEAF',
        nodeId,
        `Leaf state reached (${node.isTerminal ? node.terminalReason : `Depth limit ${options.depth}`}). Static Evaluation = ${evalResult.score}.`,
        isMax ? 3 : 12,
        { currentVal: evalResult.score }
      );

      return evalResult.score;
    }

    // 2. Generate Legal Moves
    let rawMoves: Direction[] = [];
    if (isMax) {
      rawMoves = getMonsterLegalMoves(node.state, options.width, options.height, options.walls);
    } else {
      rawMoves = getHeroLegalMoves(node.state, options.width, options.height, options.walls, options.exitPos);
    }

    if (rawMoves.length === 0) {
      rawMoves = ['WAIT'];
    }

    const legalMoves = orderMoves(rawMoves, node.state, isMax);
    nodesExpanded++;

    let currentAlpha = alpha;
    let currentBeta = beta;

    if (isMax) {
      // MAX PLAYER (Monster)
      let maxEval = -Infinity;
      let bestMoveForNode: Direction | null = null;
      let bestChildForNode: string | null = null;

      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i];
        const nextState = applyMove(node.state, move, true, options.keyPos, options.traps);

        const childId = `node_${nodeCounter++}`;
        const childNode: SearchNode = {
          id: childId,
          parentId: nodeId,
          depth: node.depth + 1,
          isMax: false, // Next is Hero's turn (MIN)
          state: nextState,
          move,
          alpha: currentAlpha,
          beta: currentBeta,
          value: null,
          isLeaf: false,
          isTerminal: false,
          isPruned: false,
          childIds: [],
          bestChildId: null,
        };
        nodes[childId] = childNode;
        node.childIds.push(childId);

        const childVal = minimax(childId, depthRemaining - 1, currentAlpha, currentBeta, false);

        recordStep(
          'CHILD_RETURN',
          nodeId,
          `Child node (Monster move: ${move}) returned score ${childVal}. MAX evaluates max(${formatNum(maxEval)}, ${childVal}).`,
          5,
          { returnedVal: childVal, currentVal: maxEval, move }
        );

        if (childVal > maxEval) {
          maxEval = childVal;
          bestMoveForNode = move;
          bestChildForNode = childId;
        }

        const oldAlpha = currentAlpha;
        currentAlpha = Math.max(currentAlpha, childVal);
        node.alpha = currentAlpha;

        if (currentAlpha !== oldAlpha) {
          recordStep(
            'UPDATE_BOUNDS',
            nodeId,
            `α updated: max(${formatNum(oldAlpha)}, ${childVal}) = ${formatNum(currentAlpha)}. Window is now [α = ${formatNum(currentAlpha)}, β = ${formatNum(currentBeta)}].`,
            6
          );
        }

        // PRUNING CONDITION FOR MAX: α >= β
        if (currentBeta <= currentAlpha) {
          betaCutoffs++;
          // Prune remaining moves
          const prunedMovesCount = legalMoves.length - 1 - i;
          totalNodesPruned += prunedMovesCount;

          for (let p = i + 1; p < legalMoves.length; p++) {
            const prunedMove = legalMoves[p];
            const pId = `node_pruned_${nodeCounter++}`;
            const pNode: SearchNode = {
              id: pId,
              parentId: nodeId,
              depth: node.depth + 1,
              isMax: false,
              state: applyMove(node.state, prunedMove, true, options.keyPos, options.traps),
              move: prunedMove,
              alpha: currentAlpha,
              beta: currentBeta,
              value: null,
              isLeaf: true,
              isTerminal: false,
              isPruned: true,
              pruneReason: `Pruned because β (${formatNum(currentBeta)}) ≤ α (${formatNum(currentAlpha)}) at parent MAX node.`,
              childIds: [],
              bestChildId: null,
            };
            nodes[pId] = pNode;
            node.childIds.push(pId);
          }

          recordStep(
            'PRUNE_BRANCH',
            nodeId,
            `✂️ ALPHA-BETA CUTOFF (β-cutoff): β (${formatNum(currentBeta)}) ≤ α (${formatNum(currentAlpha)}). Hero (MIN above) would never permit this branch. ${prunedMovesCount} remaining Monster move(s) PRUNED!`,
            7
          );
          break;
        }
      }

      node.value = maxEval;
      node.bestChildId = bestChildForNode;

      recordStep(
        'BACKUP_VALUE',
        nodeId,
        `MAX node completed. Best score backed up: ${formatNum(maxEval)} (Selected Move: ${bestMoveForNode || 'NONE'}).`,
        8,
        { currentVal: maxEval }
      );

      return maxEval;
    } else {
      // MIN PLAYER (Hero)
      let minEval = Infinity;
      let bestMoveForNode: Direction | null = null;
      let bestChildForNode: string | null = null;

      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i];
        const nextState = applyMove(node.state, move, false, options.keyPos, options.traps);

        const childId = `node_${nodeCounter++}`;
        const childNode: SearchNode = {
          id: childId,
          parentId: nodeId,
          depth: node.depth + 1,
          isMax: true, // Next is Monster's turn (MAX)
          state: nextState,
          move,
          alpha: currentAlpha,
          beta: currentBeta,
          value: null,
          isLeaf: false,
          isTerminal: false,
          isPruned: false,
          childIds: [],
          bestChildId: null,
        };
        nodes[childId] = childNode;
        node.childIds.push(childId);

        const childVal = minimax(childId, depthRemaining - 1, currentAlpha, currentBeta, true);

        recordStep(
          'CHILD_RETURN',
          nodeId,
          `Child node (Hero move: ${move}) returned score ${childVal}. MIN evaluates min(${formatNum(minEval)}, ${childVal}).`,
          14,
          { returnedVal: childVal, currentVal: minEval, move }
        );

        if (childVal < minEval) {
          minEval = childVal;
          bestMoveForNode = move;
          bestChildForNode = childId;
        }

        const oldBeta = currentBeta;
        currentBeta = Math.min(currentBeta, childVal);
        node.beta = currentBeta;

        if (currentBeta !== oldBeta) {
          recordStep(
            'UPDATE_BOUNDS',
            nodeId,
            `β updated: min(${formatNum(oldBeta)}, ${childVal}) = ${formatNum(currentBeta)}. Window is now [α = ${formatNum(currentAlpha)}, β = ${formatNum(currentBeta)}].`,
            15
          );
        }

        // PRUNING CONDITION FOR MIN: α >= β
        if (currentBeta <= currentAlpha) {
          alphaCutoffs++;
          const prunedMovesCount = legalMoves.length - 1 - i;
          totalNodesPruned += prunedMovesCount;

          for (let p = i + 1; p < legalMoves.length; p++) {
            const prunedMove = legalMoves[p];
            const pId = `node_pruned_${nodeCounter++}`;
            const pNode: SearchNode = {
              id: pId,
              parentId: nodeId,
              depth: node.depth + 1,
              isMax: true,
              state: applyMove(node.state, prunedMove, false, options.keyPos, options.traps),
              move: prunedMove,
              alpha: currentAlpha,
              beta: currentBeta,
              value: null,
              isLeaf: true,
              isTerminal: false,
              isPruned: true,
              pruneReason: `Pruned because α (${formatNum(currentAlpha)}) ≥ β (${formatNum(currentBeta)}) at parent MIN node.`,
              childIds: [],
              bestChildId: null,
            };
            nodes[pId] = pNode;
            node.childIds.push(pId);
          }

          recordStep(
            'PRUNE_BRANCH',
            nodeId,
            `✂️ ALPHA-BETA CUTOFF (α-cutoff): α (${formatNum(currentAlpha)}) ≥ β (${formatNum(currentBeta)}). Monster (MAX above) would never permit this branch. ${prunedMovesCount} remaining Hero move(s) PRUNED!`,
            16
          );
          break;
        }
      }

      node.value = minEval;
      node.bestChildId = bestChildForNode;

      recordStep(
        'BACKUP_VALUE',
        nodeId,
        `MIN node completed. Best score backed up: ${formatNum(minEval)} (Selected Move: ${bestMoveForNode || 'NONE'}).`,
        17,
        { currentVal: minEval }
      );

      return minEval;
    }
  }

  // Execute recursive Minimax with Alpha-Beta
  const bestScore = minimax(rootId, options.depth, -Infinity, Infinity, true);

  // Find best move from root's best child
  let bestMove: Direction = 'WAIT';
  if (rootNode.bestChildId && nodes[rootNode.bestChildId]) {
    bestMove = nodes[rootNode.bestChildId].move || 'WAIT';
  } else if (rootNode.childIds.length > 0) {
    bestMove = nodes[rootNode.childIds[0]].move || 'WAIT';
  }

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  // Approximate unpruned equivalent nodes (branching factor b^d)
  const averageBranching = 3.2;
  const unprunedEquivalentNodes = Math.round(
    Array.from({ length: options.depth + 1 }, (_, i) => Math.pow(averageBranching, i)).reduce((a, b) => a + b, 0)
  );

  const stats: AlgorithmStats = {
    totalNodesExplored,
    totalNodesPruned,
    nodesEvaluated,
    nodesExpanded,
    unprunedEquivalentNodes: Math.max(unprunedEquivalentNodes, totalNodesExplored + totalNodesPruned),
    alphaCutoffs,
    betaCutoffs,
    executionTimeMs,
    bestMove,
    bestValue: bestScore,
    searchDepth: options.depth,
    moveOrdering,
  };

  return {
    bestMove,
    bestValue: bestScore,
    rootId,
    nodes,
    trace,
    stats,
  };
}

/**
 * Standard Minimax without pruning (for comparison benchmark).
 */
export function runPlainMinimax(
  initialState: SimpleState,
  options: MinimaxOptions
): {
  bestMove: Direction;
  bestValue: number;
  nodesVisited: number;
  nodesEvaluated: number;
  nodesExpanded: number;
  executionTimeMs: number;
} {
  const startTime = performance.now();
  let nodesVisited = 0;
  let nodesEvaluated = 0;
  let nodesExpanded = 0;
  const moveOrdering: MoveOrderingStrategy = options.moveOrdering || 'heuristic';

  function orderMoves(moves: Direction[], state: SimpleState, isMax: boolean): Direction[] {
    if (moveOrdering === 'natural') {
      return [...moves];
    }
    const sorted = [...moves].sort((a, b) => {
      const sA = applyMove(state, a, isMax, options.keyPos, options.traps);
      const sB = applyMove(state, b, isMax, options.keyPos, options.traps);
      const distA = Math.abs(sA.monster.x - sA.hero.x) + Math.abs(sA.monster.y - sA.hero.y);
      const distB = Math.abs(sB.monster.x - sB.hero.x) + Math.abs(sB.monster.y - sB.hero.y);
      if (isMax) {
        return distA - distB;
      } else {
        return distB - distA;
      }
    });

    if (moveOrdering === 'reverse') {
      return sorted.reverse();
    }
    return sorted;
  }

  function plainMinimax(
    state: SimpleState,
    depthRemaining: number,
    depth: number,
    isMax: boolean
  ): { value: number; bestMove?: Direction } {
    nodesVisited++;

    const isMonsterOnHero = isSamePos(state.monster, state.hero);
    const isHeroDead = !state.heroAlive;
    const isHeroEscaped = state.hasKey && isSamePos(state.hero, options.exitPos);

    if (isMonsterOnHero || isHeroDead || isHeroEscaped || depthRemaining === 0) {
      nodesEvaluated++;
      const evalRes = evaluateState(
        state,
        options.weights,
        options.width,
        options.height,
        options.walls,
        options.traps,
        options.keyPos,
        options.exitPos,
        depth
      );
      return { value: evalRes.score };
    }

    if (isMax) {
      let maxEval = -Infinity;
      let bestMove: Direction = 'WAIT';
      const rawMoves = getMonsterLegalMoves(state, options.width, options.height, options.walls);
      const moves = orderMoves(rawMoves.length === 0 ? ['WAIT'] : rawMoves, state, true);
      nodesExpanded++;

      for (const move of moves) {
        const nextState = applyMove(state, move, true, options.keyPos, options.traps);
        const res = plainMinimax(nextState, depthRemaining - 1, depth + 1, false);
        if (res.value > maxEval) {
          maxEval = res.value;
          bestMove = move;
        }
      }
      return { value: maxEval, bestMove };
    } else {
      let minEval = Infinity;
      let bestMove: Direction = 'WAIT';
      const rawMoves = getHeroLegalMoves(state, options.width, options.height, options.walls, options.exitPos);
      const moves = orderMoves(rawMoves.length === 0 ? ['WAIT'] : rawMoves, state, false);
      nodesExpanded++;

      for (const move of moves) {
        const nextState = applyMove(state, move, false, options.keyPos, options.traps);
        const res = plainMinimax(nextState, depthRemaining - 1, depth + 1, true);
        if (res.value < minEval) {
          minEval = res.value;
          bestMove = move;
        }
      }
      return { value: minEval, bestMove };
    }
  }

  const result = plainMinimax(initialState, options.depth, 0, true);
  const endTime = performance.now();

  return {
    bestMove: result.bestMove || 'WAIT',
    bestValue: result.value,
    nodesVisited,
    nodesEvaluated,
    nodesExpanded,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };
}

function formatNum(num: number): string {
  if (num === Infinity) return '+∞';
  if (num === -Infinity) return '-∞';
  return num.toString();
}
