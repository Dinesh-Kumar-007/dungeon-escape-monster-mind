import React from 'react';
import {
  Direction,
  HeuristicWeights,
  LevelConfig,
  SimpleState,
} from '../types/game';
import { DEFAULT_HEURISTIC_WEIGHTS, evaluateState } from '../ai/evaluation';
import { applyMove, getMonsterLegalMoves } from '../utils/pathfinding';
import {
  Sliders,
  RotateCcw,
  Info,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Compass,
} from 'lucide-react';

interface HeuristicInspectorPageProps {
  weights: HeuristicWeights;
  onUpdateWeights: (weights: HeuristicWeights) => void;
  currentState: SimpleState;
  currentLevel: LevelConfig;
}

export const HeuristicInspectorPage: React.FC<HeuristicInspectorPageProps> = ({
  weights,
  onUpdateWeights,
  currentState,
  currentLevel,
}) => {
  // 1. Current State Evaluation
  const currentBreakdown = evaluateState(
    currentState,
    weights,
    currentLevel.width,
    currentLevel.height,
    currentLevel.walls,
    currentLevel.traps,
    currentLevel.keyPos,
    currentLevel.exitPos,
    0
  );

  // 2. Candidate Monster Moves Evaluation from current state
  const legalMoves = getMonsterLegalMoves(
    currentState,
    currentLevel.width,
    currentLevel.height,
    currentLevel.walls
  );

  const candidateMovesBreakdown = legalMoves.map((move) => {
    const nextState = applyMove(
      currentState,
      move,
      true,
      currentLevel.keyPos,
      currentLevel.traps
    );
    const evalResult = evaluateState(
      nextState,
      weights,
      currentLevel.width,
      currentLevel.height,
      currentLevel.walls,
      currentLevel.traps,
      currentLevel.keyPos,
      currentLevel.exitPos,
      1
    );

    return {
      move,
      nextState,
      evalResult,
    };
  });

  // Sort candidates by score descending
  candidateMovesBreakdown.sort((a, b) => b.evalResult.score - a.evalResult.score);
  const bestCandidate = candidateMovesBreakdown[0];

  const handleSliderChange = (key: keyof HeuristicWeights, val: number) => {
    onUpdateWeights({
      ...weights,
      [key]: val,
    });
  };

  const handleReset = () => {
    onUpdateWeights({ ...DEFAULT_HEURISTIC_WEIGHTS });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Perspective Disclaimer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>HEURISTIC INSPECTOR</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Candidate Move Scoring & Utility Function</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Static Evaluation & Weight Tuning
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Inspect how the AI scores every candidate monster move from the current dungeon board. Adjusting weights immediately alters the monster's in-game behavior and search evaluations.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Weights to Default</span>
          </button>
        </div>

        {/* Perspective Callout */}
        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Utility Perspective:</strong> All values represent the <strong>Monster's utility (MAX player)</strong>. Higher positive numbers indicate advantageous positions for the Monster (e.g. cornering hero or blocking objective), while lower or negative scores favor the Hero.
          </p>
        </div>
      </div>

      {/* Candidate Moves Breakdown Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Candidate Monster Moves from Current Position</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {candidateMovesBreakdown.length} Legal Action(s) Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {candidateMovesBreakdown.map((candidate, idx) => {
            const isBest = idx === 0;
            return (
              <div
                key={candidate.move}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isBest
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {candidate.move}
                      </span>
                      {isBest && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                          BEST CHOICE
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {candidate.evalResult.score > 0 ? `+${candidate.evalResult.score}` : candidate.evalResult.score}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    {candidate.evalResult.terms.map((term, tIdx) => (
                      <div key={tIdx} className="flex justify-between text-slate-400">
                        <span className="truncate max-w-[140px]">{term.label}:</span>
                        <span className={term.contribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {term.contribution >= 0 ? `+${term.contribution}` : term.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between">
                  <span>Target Pos:</span>
                  <span className="font-mono text-slate-300">
                    ({candidate.nextState.monster.x}, {candidate.nextState.monster.y})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Heuristic Weights Tuning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Interactive Heuristic Weights (Active Gameplay Effect)</span>
            </h2>
            <span className="text-xs text-slate-400">Real-Time Adjustment</span>
          </div>

          <div className="space-y-4">
            {/* Catch Hero Weight */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Catch Hero Proximity Weight (W_catch)</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monster receives this score for every cell it closes the distance to the Hero.
                  </p>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">{weights.catchHero}</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={weights.catchHero}
                onChange={(e) => handleSliderChange('catchHero', Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Delay Key Weight */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Key Denial Weight (W_key)</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monster receives points when the Hero is farther from the uncollected key.
                  </p>
                </div>
                <span className="font-mono font-bold text-cyan-400 text-sm">{weights.delayKey}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.delayKey}
                onChange={(e) => handleSliderChange('delayKey', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Delay Exit Weight */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Exit Blockade Weight (W_exit)</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    After the key is taken, Monster prioritizes keeping Hero far from the exit portal.
                  </p>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">{weights.delayExit}</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={weights.delayExit}
                onChange={(e) => handleSliderChange('delayExit', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Guard Key / Exit */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Guarding Active Objective (W_guard)</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monster is rewarded for maintaining proximity to whichever objective the Hero needs.
                  </p>
                </div>
                <span className="font-mono font-bold text-purple-400 text-sm">{weights.guardKeyOrExit}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weights.guardKeyOrExit}
                onChange={(e) => handleSliderChange('guardKeyOrExit', Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Hero Mobility Penalty */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">Cornering / Mobility Penalty (W_mobility)</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Penalizes states where the Hero has many open escape corridors; rewards trapping hero in dead ends.
                  </p>
                </div>
                <span className="font-mono font-bold text-rose-400 text-sm">{weights.heroMobility}</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.heroMobility}
                onChange={(e) => handleSliderChange('heroMobility', Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Heuristic Formula Breakdown (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Formula Specification</span>
          </h2>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed space-y-1">
            <p className="text-amber-300 font-bold">h(S) = W_catch · Proximity(M, H)</p>
            <p className="text-cyan-300">
              {currentState.hasKey
                ? '     + W_exit · Dist(H, Exit) - W_guard · Dist(M, Exit)'
                : '     + W_key · Dist(H, Key) - W_guard · Dist(M, Key)'}
            </p>
            <p className="text-rose-300">     - W_mobility · HeroSafeMoves(H)</p>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-bold text-slate-200">Current Position Static Score</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {currentBreakdown.score > 0 ? `+${currentBreakdown.score}` : currentBreakdown.score}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluated from Monster's perspective before applying any candidate actions.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-bold text-slate-200">Recommended Next Monster Ply</span>
              <div className="text-base font-mono font-bold text-cyan-300">
                Action: {bestCandidate ? bestCandidate.move : 'WAIT'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Yields highest 1-ply successor state utility of {bestCandidate ? bestCandidate.evalResult.score : 0}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
