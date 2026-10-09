import { Direction, Position, SimpleState } from '../types/game';
import { isSamePos } from '../levels/dungeons';

export const DIRECTIONS: Record<Exclude<Direction, 'WAIT'>, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const ALL_DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'WAIT'];

/**
 * Calculates BFS shortest path distance between start and target on grid,
 * strictly accounting for walls.
 */
export function getShortestPathDistance(
  start: Position,
  target: Position,
  width: number,
  height: number,
  walls: Position[]
): number {
  if (isSamePos(start, target)) return 0;

  const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
  const visited = new Set<string>();
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;

    for (const dir of Object.values(DIRECTIONS)) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const key = `${nx},${ny}`;
      if (wallSet.has(key) || visited.has(key)) continue;

      if (nx === target.x && ny === target.y) {
        return dist + 1;
      }

      visited.add(key);
      queue.push({ pos: { x: nx, y: ny }, dist: dist + 1 });
    }
  }

  // Fallback to Manhattan distance if path blocked
  return Math.abs(start.x - target.x) + Math.abs(start.y - target.y) + 15;
}

/**
 * Generates all legal moves for Monster from current state.
 */
export function getMonsterLegalMoves(
  state: SimpleState,
  width: number,
  height: number,
  walls: Position[]
): Direction[] {
  const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
  const legal: Direction[] = [];

  for (const dir of Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[]) {
    const delta = DIRECTIONS[dir];
    const nx = state.monster.x + delta.x;
    const ny = state.monster.y + delta.y;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      if (!wallSet.has(`${nx},${ny}`)) {
        legal.push(dir);
      }
    }
  }

  // Include WAIT if trapped (or as an option)
  if (legal.length === 0) {
    legal.push('WAIT');
  }

  return legal;
}

/**
 * Generates all legal moves for Hero from current state.
 */
export function getHeroLegalMoves(
  state: SimpleState,
  width: number,
  height: number,
  walls: Position[],
  exitPos: Position
): Direction[] {
  const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
  const legal: Direction[] = [];

  for (const dir of Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[]) {
    const delta = DIRECTIONS[dir];
    const nx = state.hero.x + delta.x;
    const ny = state.hero.y + delta.y;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      // Cannot enter walls
      if (wallSet.has(`${nx},${ny}`)) continue;

      // Cannot enter exit if key is not yet held
      if (nx === exitPos.x && ny === exitPos.y && !state.hasKey) continue;

      legal.push(dir);
    }
  }

  // Hero can WAIT/pass turn if strategic or if surrounded
  legal.push('WAIT');

  return legal;
}

/**
 * Applies a move to the state and returns the new state.
 */
export function applyMove(
  state: SimpleState,
  move: Direction,
  isMonster: boolean,
  keyPos: Position,
  traps: Position[]
): SimpleState {
  if (move === 'WAIT') {
    return { ...state };
  }

  const delta = DIRECTIONS[move];
  if (isMonster) {
    const newMonsterPos = { x: state.monster.x + delta.x, y: state.monster.y + delta.y };
    return {
      ...state,
      monster: newMonsterPos,
    };
  } else {
    const newHeroPos = { x: state.hero.x + delta.x, y: state.hero.y + delta.y };
    const justCollectedKey = state.hasKey || isSamePos(newHeroPos, keyPos);
    const steppedOnTrap = traps.some(t => isSamePos(t, newHeroPos));

    return {
      ...state,
      hero: newHeroPos,
      hasKey: justCollectedKey,
      heroAlive: !steppedOnTrap,
    };
  }
}
