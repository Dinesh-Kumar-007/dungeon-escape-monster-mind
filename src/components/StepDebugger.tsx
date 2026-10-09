import React, { useState, useEffect } from 'react';
import {
  Direction,
  HeuristicWeights,
  LevelConfig,
  SearchResult,
  SimpleState,
  TraceStep,
} from '../types/game';
import { runAlphaBetaSearch } from '../ai/minimax';
import { soundManager } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Code2,
  Bug,
  Scissors,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const PSEUDOCODE_LINES = [
  'function AlphaBeta(node, depth, α, β, isMaximizing):',
  '  if depth == 0 or isTerminal(node):',
  '    return Evaluate(node.state)',
  '  if isMaximizing (MAX - Monster):',
  '    maxEval = -∞',
  '    for each child in GetLegalMoves(node):',
  '      eval = AlphaBeta(child, depth - 1, α, β, false)',
  '      maxEval = max(maxEval, eval)',
  '      α = max(α, eval)',
  '      if β <= α: // Prune remainder of MAX moves',
  '        break',
  '    return maxEval',
  '  else (MIN - Hero):',
  '    minEval = +∞',
  '    for each child in GetLegalMoves(node):',
  '      eval = AlphaBeta(child, depth - 1, α, β, true)',
  '      minEval = min(minEval, eval)',
  '      β = min(β, eval)',
  '      if β <= α: // Prune remainder of MIN moves',
  '        break',
  '    return minEval',
];

interface StepDebuggerProps {
  currentSearchResult: SearchResult | null;
  currentState: SimpleState;
  currentLevel: LevelConfig;
  weights: HeuristicWeights;
  searchDepth: number;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onUpdateSearchResult?: (res: SearchResult) => void;
}

export const StepDebugger: React.FC<StepDebuggerProps> = ({
  currentSearchResult,
  currentState,
  currentLevel,
  weights,
  searchDepth,
  currentStepIndex,
  onStepChange,
  onUpdateSearchResult,
}) => {
  // If no search result exists yet, create one for current position
  const [localSearchResult, setLocalSearchResult] = useState<SearchResult | null>(() => {
    if (currentSearchResult) return currentSearchResult;
    return runAlphaBetaSearch(currentState, {
      depth: searchDepth,
      weights,
      width: currentLevel.width,
      height: currentLevel.height,
      walls: currentLevel.walls,
      traps: currentLevel.traps,
      keyPos: currentLevel.keyPos,
      exitPos: currentLevel.exitPos,
      moveOrdering: 'heuristic',
    });
  });

  const searchResult = currentSearchResult || localSearchResult;
  const trace = searchResult?.trace || [];
  const currentStep: TraceStep | undefined = trace[currentStepIndex];

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(600);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'BOUNDS' | 'PRUNE'>('ALL');

  // Autoplay effect
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= trace.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextIdx = currentStepIndex + 1;
      onStepChange(nextIdx);
      if (trace[nextIdx]) {
        soundManager.playStepSound(trace[nextIdx].type);
      }
    }, playbackSpeedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, trace, playbackSpeedMs, onStepChange]);

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      const nextIdx = currentStepIndex - 1;
      onStepChange(nextIdx);
      soundManager.playStepSound(trace[nextIdx]?.type || 'ENTER_NODE');
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (currentStepIndex < trace.length - 1) {
      const nextIdx = currentStepIndex + 1;
      onStepChange(nextIdx);
      soundManager.playStepSound(trace[nextIdx]?.type || 'ENTER_NODE');
    }
  };

  const handleJumpStart = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  const handleJumpEnd = () => {
    setIsPlaying(false);
    if (trace.length > 0) {
      onStepChange(trace.length - 1);
    }
  };

  const filteredTrace = trace.filter((step) => {
    if (eventFilter === 'BOUNDS') return step.type === 'UPDATE_BOUNDS';
    if (eventFilter === 'PRUNE') return step.type === 'PRUNE_BRANCH';
    return true;
  });

  const activeNode = currentStep && searchResult ? searchResult.nodes[currentStep.nodeId] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>STEP DEBUGGER</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Granular Execution Trace & State Machine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Ply-by-Ply Execution Debugger
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Follow every recursive function invocation, bound update, heuristic leaf evaluation, and pruning cutoff as the monster evaluates future plies.
            </p>
          </div>

          {searchResult && (
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Active Step</span>
                <div className="text-cyan-400 font-bold">{currentStepIndex + 1} / {trace.length}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Selected Action</span>
                <div className="text-emerald-400 font-bold">{searchResult.bestMove}</div>
              </div>
            </div>
          )}
        </div>

        {/* Playback Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpStart}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              title="Jump to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleStepPrev}
              disabled={currentStepIndex <= 0}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 disabled:opacity-40 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg flex items-center gap-1.5 font-semibold shadow-md transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Execution'}</span>
            </button>
            <button
              onClick={handleStepNext}
              disabled={currentStepIndex >= trace.length - 1}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 disabled:opacity-40 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpEnd}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-[11px]"
            >
              Jump to End
            </button>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span>Pace:</span>
            <input
              type="range"
              min="200"
              max="1500"
              step="100"
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-300 w-12 text-right">{playbackSpeedMs}ms</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Step Details & Code Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Step Details & Search State (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          {currentStep && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-1 bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 rounded-lg font-bold">
                    STEP {currentStep.stepIndex + 1}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                      currentStep.type === 'PRUNE_BRANCH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : currentStep.type === 'UPDATE_BOUNDS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {currentStep.type}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Node: {currentStep.nodeId} (Depth {currentStep.depth})
                </div>
              </div>

              {/* Natural Language Explanation Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Algorithmic Explanation
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {currentStep.explanation}
                </p>
              </div>

              {/* Bound Window & Value Cards */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Search Role</div>
                  <div className={`font-bold mt-1 ${currentStep.isMax ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {currentStep.isMax ? 'MAX (Monster)' : 'MIN (Hero)'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Window [α, β]</div>
                  <div className="text-amber-400 font-bold mt-1">
                    [{currentStep.alpha === -Infinity ? '-∞' : currentStep.alpha},{' '}
                    {currentStep.beta === Infinity ? '+∞' : currentStep.beta}]
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Current Value</div>
                  <div className="text-emerald-400 font-bold mt-1">
                    {currentStep.currentVal !== null ? currentStep.currentVal : 'Exploring'}
                  </div>
                </div>
              </div>

              {/* Successor State Details */}
              {activeNode && (
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Board Coordinate State at this Node
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                    <div>Monster Pos: ({activeNode.state.monster.x}, {activeNode.state.monster.y})</div>
                    <div>Hero Pos: ({activeNode.state.hero.x}, {activeNode.state.hero.y})</div>
                    <div>Key Held: {activeNode.state.hasKey ? 'Yes' : 'No'}</div>
                    <div>Hero Alive: {activeNode.state.heroAlive ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Execution History Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search Event Log</span>
              </h2>

              <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setEventFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${eventFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  All ({trace.length})
                </button>
                <button
                  onClick={() => setEventFilter('BOUNDS')}
                  className={`px-2 py-0.5 rounded ${eventFilter === 'BOUNDS' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
                >
                  Bounds
                </button>
                <button
                  onClick={() => setEventFilter('PRUNE')}
                  className={`px-2 py-0.5 rounded ${eventFilter === 'PRUNE' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'}`}
                >
                  Cutoffs
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
              {filteredTrace.map((step) => {
                const isActive = step.stepIndex === currentStepIndex;
                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => onStepChange(step.stepIndex)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[11px] text-cyan-400">#{step.stepIndex + 1}</span>
                      <span className="text-[11px] font-semibold text-slate-300">{step.type}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[280px]">
                        {step.explanation}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 shrink-0 font-bold ml-2">
                      d={step.depth}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pseudocode Synchronized Highlight (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Algorithm Pointer</span>
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              Line {currentStep ? currentStep.pseudocodeLine : 1}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
            {PSEUDOCODE_LINES.map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrent = currentStep && currentStep.pseudocodeLine === lineNum;

              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-cyan-500/25 text-cyan-200 border-l-2 border-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[9px] text-slate-600 select-none w-4 text-right">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
            As you step through the trace, the debugger highlights the exact branch of code being executed—whether exploring candidate moves, updating Alpha/Beta bounds, or executing early branch cutoffs.
          </p>
        </div>
      </div>
    </div>
  );
};
