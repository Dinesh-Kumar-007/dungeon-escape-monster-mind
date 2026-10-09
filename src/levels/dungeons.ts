import { LevelConfig, Position } from '../types/game';

export const DUNGEON_LEVELS: LevelConfig[] = [
  {
    id: 'level-1',
    name: '1. Training Hall (6x6)',
    description: 'Compact chamber ideal for observing early tree pruning and ply-by-ply decisions.',
    width: 6,
    height: 6,
    heroStart: { x: 1, y: 4 },
    monsterStart: { x: 4, y: 1 },
    keyPos: { x: 1, y: 1 },
    exitPos: { x: 4, y: 4 },
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ],
    traps: [
      { x: 2, y: 3 },
    ],
  },
  {
    id: 'level-2',
    name: '2. The Fork & Chokepoint (7x7)',
    description: 'A central chokepoint forces dramatic alpha-beta branch pruning as monster intercepts.',
    width: 7,
    height: 7,
    heroStart: { x: 1, y: 5 },
    monsterStart: { x: 5, y: 1 },
    keyPos: { x: 1, y: 1 },
    exitPos: { x: 5, y: 5 },
    walls: [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 3, y: 6 },
      // Leaves (3, 3) as the only direct central pass!
    ],
    traps: [
      { x: 2, y: 2 },
      { x: 4, y: 4 },
    ],
  },
  {
    id: 'level-3',
    name: '3. The Spike Vault (7x7)',
    description: 'Traps guard rapid shortcuts. Monster balances intercepting the key vs guarding the exit.',
    width: 7,
    height: 7,
    heroStart: { x: 1, y: 5 },
    monsterStart: { x: 5, y: 2 },
    keyPos: { x: 5, y: 5 },
    exitPos: { x: 1, y: 1 },
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 3, y: 1 },
    ],
    traps: [
      { x: 3, y: 3 },
      { x: 1, y: 3 },
      { x: 5, y: 3 },
    ],
  },
  {
    id: 'level-4',
    name: '4. The Minotaur Crypt (8x8)',
    description: 'A labyrinthine arena testing high search depths, multi-corridor loops, and tactical evasion.',
    width: 8,
    height: 8,
    heroStart: { x: 1, y: 6 },
    monsterStart: { x: 6, y: 1 },
    keyPos: { x: 1, y: 1 },
    exitPos: { x: 6, y: 6 },
    walls: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
      { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 2, y: 5 },
    ],
    traps: [
      { x: 3, y: 2 },
      { x: 5, y: 2 },
      { x: 4, y: 4 },
    ],
  },
];

export function isSamePos(p1: Position, p2: Position): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}
