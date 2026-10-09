import React from 'react';
import { DungeonCanvas } from './DungeonCanvas';
import {
  Direction,
  GameState,
  LevelConfig,
  NavigationSection,
} from '../types/game';
import { DUNGEON_LEVELS } from '../levels/dungeons';
import {
  RotateCcw,
  Play,
  Pause,
  Key,
  DoorOpen,
  Skull,
  Shield,
  HelpCircle,
  SlidersHorizontal,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface GameArenaProps {
  gameState: GameState;
  currentLevel: LevelConfig;
  searchDepth: number;
  isAutoMonster: boolean;
  isAiThinking: boolean;
  onHeroMove: (dir: Direction) => void;
  onRestart: () => void;
  onSelectLevel: (lvl: LevelConfig) => void;
  onChangeDepth: (depth: number) => void;
  onToggleAutoMonster: () => void;
  onStepMonsterManual: () => void;
  onNavigate: (section: NavigationSection) => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  gameState,
  currentLevel,
  searchDepth,
  isAutoMonster,
  isAiThinking,
  onHeroMove,
  onRestart,
  onSelectLevel,
  onChangeDepth,
  onToggleAutoMonster,
  onStepMonsterManual,
  onNavigate,
}) => {
  const depthLabels: Record<number, { title: string; desc: string }> = {
    1: { title: 'Novice (d=1)', desc: 'Immediate 1-ply tactical greedy reaction' },
    2: { title: 'Scout (d=2)', desc: '1 full round: anticipates hero reply' },
    3: { title: 'Hunter (d=3)', desc: '3 plies: cornering & trajectory foresight' },
    4: { title: 'Master (d=4)', desc: '4 plies: multi-round positional trap' },
    5: { title: 'Grandmaster (d=5)', desc: '5 plies: deep adversarial evaluation' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Objective & Status Header Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <span>MISSION OBJECTIVE</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300 font-normal">Turn-Based Strategic Evacuation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Game Arena: Escape the Dungeon
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {gameState.hasKey ? (
              <span className="text-amber-300 font-medium">
                Golden key acquired! Navigate through traps to the green exit portal.
              </span>
            ) : (
              <span>
                Retrieve the golden key first to unlock the dungeon exit portal, while evading the Minimax monster.
              </span>
            )}
          </p>
        </div>

        {/* Compact AI Status Indicator */}
        <div className="flex flex-col sm:items-end gap-1.5 bg-slate-950/80 border border-slate-800/90 px-3.5 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">AI Algorithm:</span>
            <span className="text-amber-400 font-mono font-semibold">
              Minimax + Alpha-Beta Pruning
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Depth: {searchDepth} plies</span>
            <span>·</span>
            <span className="text-cyan-400">
              {isAiThinking ? 'Calculating...' : 'Standing by'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid & Control Hub Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dungeon Canvas Arena (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <DungeonCanvas
            gameState={gameState}
            onHeroMove={onHeroMove}
            isAiThinking={isAiThinking}
            highlightMonsterMove={gameState.lastMonsterMove}
          />

          {/* Quick link to AI Lab */}
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => onNavigate('lab')}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors group p-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>How does the AI think? Explore algorithms in AI Lab</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Right: Operational Controls & Chamber Setup (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Dungeon Chamber Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Dungeon Chamber
              </h2>
              <button
                onClick={onRestart}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-xs text-slate-200 hover:text-white transition-colors"
                title="Restart current dungeon"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DUNGEON_LEVELS.map((lvl) => {
                const isSelected = currentLevel.id === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectLevel(lvl)}
                    className={`p-3 text-left rounded-xl border text-xs transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 truncate">{lvl.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {lvl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Search Depth & Difficulty Setting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  AI Difficulty & Depth
                </h2>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                {depthLabels[searchDepth]?.title}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              value={searchDepth}
              onChange={(e) => onChangeDepth(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>d=1 (Novice)</span>
              <span>d=2 (Scout)</span>
              <span>d=3 (Hunter)</span>
              <span>d=4 (Master)</span>
              <span>d=5 (Nightmare)</span>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800/70 p-2.5 rounded-lg leading-relaxed">
              {depthLabels[searchDepth]?.desc}
            </p>
          </div>

          {/* Stepping Mode & Turn Trigger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Simulation Pace & Monster Mode
            </h2>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onToggleAutoMonster}
                className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                  isAutoMonster
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                    : 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                }`}
              >
                {isAutoMonster ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isAutoMonster ? 'Pacing: Auto Step' : 'Pacing: Manual Step'}</span>
              </button>

              {!isAutoMonster && (
                <button
                  onClick={onStepMonsterManual}
                  disabled={gameState.turn !== 'monster' || gameState.isGameOver}
                  className="flex-1 py-2.5 px-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Flame className="w-4 h-4" />
                  <span>Execute Monster Ply</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Dungeon Size:</span>
                <span className="font-mono text-slate-200">{currentLevel.width} × {currentLevel.height} tiles</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Key Status:</span>
                <span className={gameState.hasKey ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                  {gameState.hasKey ? 'Collected' : 'Waiting in Chamber'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Turn:</span>
                <span className={gameState.turn === 'hero' ? 'text-cyan-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {gameState.turn === 'hero' ? 'Hero (Player)' : 'Monster (AI Minimax)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Turn Count:</span>
                <span className="font-mono text-slate-200">{gameState.turnCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
