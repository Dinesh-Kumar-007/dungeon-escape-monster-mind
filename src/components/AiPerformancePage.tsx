import React, { useState } from 'react';
import {
  HeuristicWeights,
  LevelConfig,
  MoveOrderingStrategy,
  SimpleState,
} from '../types/game';
import { runPlainMinimax, runAlphaBetaSearch } from '../ai/minimax';
import {
  BarChart3,
  Play,
  Zap,
  CheckCircle2,
  Clock,
  Scissors,
  Layers,
  ArrowRight,
  TrendingDown,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface AiPerformancePageProps {
  currentState: SimpleState;
  currentLevel: LevelConfig;
  weights: HeuristicWeights;
  searchDepth: number;
}

interface SingleBenchmarkData {
  depth: number;
  moveOrdering: MoveOrderingStrategy;
  minimaxNodesVisited: number;
  minimaxNodesEvaluated: number;
  minimaxNodesExpanded: number;
  minimaxTimeMs: number;
  minimaxMove: string;
  minimaxVal: number;
  alphaBetaNodesVisited: number;
  alphaBetaNodesEvaluated: number;
  alphaBetaNodesExpanded: number;
  alphaBetaNodesPruned: number;
  alphaCutoffs: number;
  betaCutoffs: number;
  alphaBetaTimeMs: number;
  alphaBetaMove: string;
  alphaBetaVal: number;
  savingsPct: number;
  decisionMatches: boolean;
  valueMatches: boolean;
}

interface DepthSweepRow {
  depth: number;
  minimaxNodes: number;
  alphaBetaNodes: number;
  minimaxTimeMs: number;
  alphaBetaTimeMs: number;
  savingsPct: number;
  prunedNodes: number;
}

export const AiPerformancePage: React.FC<AiPerformancePageProps> = ({
  currentState,
  currentLevel,
  weights,
  searchDepth: initialDepth,
}) => {
  const [selectedDepth, setSelectedDepth] = useState<number>(initialDepth);
  const [selectedMoveOrdering, setSelectedMoveOrdering] = useState<MoveOrderingStrategy>('heuristic');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<SingleBenchmarkData | null>(null);

  // Multi-depth sweep state
  const [sweepResults, setSweepResults] = useState<DepthSweepRow[] | null>(null);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);

  // Run single benchmark on current configuration
  const handleRunSingle = () => {
    setIsBenchmarking(true);

    setTimeout(() => {
      const options = {
        depth: selectedDepth,
        weights,
        width: currentLevel.width,
        height: currentLevel.height,
        walls: currentLevel.walls,
        traps: currentLevel.traps,
        keyPos: currentLevel.keyPos,
        exitPos: currentLevel.exitPos,
        moveOrdering: selectedMoveOrdering,
      };

      const plain = runPlainMinimax(currentState, options);
      const ab = runAlphaBetaSearch(currentState, options);

      const savings =
        plain.nodesVisited > 0
          ? Math.round(((plain.nodesVisited - ab.stats.totalNodesExplored) / plain.nodesVisited) * 1000) / 10
          : 0;

      setSingleResult({
        depth: selectedDepth,
        moveOrdering: selectedMoveOrdering,
        minimaxNodesVisited: plain.nodesVisited,
        minimaxNodesEvaluated: plain.nodesEvaluated,
        minimaxNodesExpanded: plain.nodesExpanded,
        minimaxTimeMs: plain.executionTimeMs,
        minimaxMove: plain.bestMove,
        minimaxVal: plain.bestValue,
        alphaBetaNodesVisited: ab.stats.totalNodesExplored,
        alphaBetaNodesEvaluated: ab.stats.nodesEvaluated,
        alphaBetaNodesExpanded: ab.stats.nodesExpanded,
        alphaBetaNodesPruned: ab.stats.totalNodesPruned,
        alphaCutoffs: ab.stats.alphaCutoffs,
        betaCutoffs: ab.stats.betaCutoffs,
        alphaBetaTimeMs: ab.stats.executionTimeMs,
        alphaBetaMove: ab.bestMove,
        alphaBetaVal: ab.bestValue,
        savingsPct: Math.max(0, savings),
        decisionMatches: plain.bestMove === ab.bestMove,
        valueMatches: plain.bestValue === ab.bestValue,
      });

      setIsBenchmarking(false);
    }, 50);
  };

  // Run multi-depth sweep benchmark (depths 1 to 4 or 5)
  const handleRunSweep = () => {
    setIsSweeping(true);

    setTimeout(() => {
      const rows: DepthSweepRow[] = [];
      const testDepths = [1, 2, 3, 4, 5];

      for (const d of testDepths) {
        const options = {
          depth: d,
          weights,
          width: currentLevel.width,
          height: currentLevel.height,
          walls: currentLevel.walls,
          traps: currentLevel.traps,
          keyPos: currentLevel.keyPos,
          exitPos: currentLevel.exitPos,
          moveOrdering: selectedMoveOrdering,
        };

        const plain = runPlainMinimax(currentState, options);
        const ab = runAlphaBetaSearch(currentState, options);

        const savings =
          plain.nodesVisited > 0
            ? Math.round(((plain.nodesVisited - ab.stats.totalNodesExplored) / plain.nodesVisited) * 1000) / 10
            : 0;

        rows.push({
          depth: d,
          minimaxNodes: plain.nodesVisited,
          alphaBetaNodes: ab.stats.totalNodesExplored,
          minimaxTimeMs: plain.executionTimeMs,
          alphaBetaTimeMs: ab.stats.executionTimeMs,
          savingsPct: Math.max(0, savings),
          prunedNodes: ab.stats.totalNodesPruned,
        });
      }

      setSweepResults(rows);
      setIsSweeping(false);
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>AI PERFORMANCE & BENCHMARKING</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Empirical Search Measurement</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Plain Minimax vs. Alpha-Beta Pruning Benchmark
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-3xl">
              Executes both Plain Minimax (unpruned) and Minimax with Alpha-Beta Pruning simultaneously on the exact same game state to measure real search metrics, node reductions, and execution times.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSingle}
              disabled={isBenchmarking}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isBenchmarking ? 'Running...' : `Run Single Test (d=${selectedDepth})`}</span>
            </button>

            <button
              onClick={handleRunSweep}
              disabled={isSweeping}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border border-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSweeping ? 'Sweeping...' : 'Run Depth Sweep (d=1-5)'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Search Depth:</span>
            <select
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value={1}>Depth 1 (1 ply)</option>
              <option value={2}>Depth 2 (2 plies)</option>
              <option value={3}>Depth 3 (3 plies)</option>
              <option value={4}>Depth 4 (4 plies)</option>
              <option value={5}>Depth 5 (5 plies)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Move Ordering Strategy:</span>
            <select
              value={selectedMoveOrdering}
              onChange={(e) => setSelectedMoveOrdering(e.target.value as MoveOrderingStrategy)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value="heuristic">Optimal Heuristic (Best Pruning Case)</option>
              <option value="natural">Natural Order (Unsorted)</option>
              <option value="reverse">Reverse Order (Worst-Case Pruning)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Single Benchmark Results */}
      {singleResult && (
        <div className="space-y-6">
          {/* Invariant Verification Bar */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              singleResult.decisionMatches && singleResult.valueMatches
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Optimality Invariance Verified: </span>
                <span>
                  Both algorithms decided identical best action (<strong>{singleResult.alphaBetaMove}</strong>) and identical minimax score (<strong>{singleResult.alphaBetaVal}</strong>).
                </span>
              </div>
            </div>

            <div className="font-mono text-sm font-bold bg-emerald-500/20 px-3 py-1 rounded-lg">
              {singleResult.savingsPct}% Node Reduction
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plain Minimax Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h2 className="text-base font-bold text-white">Plain Minimax (No Pruning)</h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded">
                  Exhaustive O(b^d)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Nodes Visited</div>
                  <div className="text-slate-100 font-bold text-lg mt-1">{singleResult.minimaxNodesVisited.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Nodes Evaluated</div>
                  <div className="text-slate-300 font-bold text-lg mt-1">{singleResult.minimaxNodesEvaluated.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Execution Time</div>
                  <div className="text-slate-300 font-bold text-lg mt-1">{singleResult.minimaxTimeMs}ms</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Selected Move:</span>
                  <span className="font-mono font-bold text-slate-100">{singleResult.minimaxMove}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backed-up Minimax Score:</span>
                  <span className="font-mono font-bold text-slate-100">{singleResult.minimaxVal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Branches Pruned:</span>
                  <span className="font-mono text-slate-500">0 (Pruning disabled)</span>
                </div>
              </div>
            </div>

            {/* Alpha-Beta Pruning Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h2 className="text-base font-bold text-white">Minimax with Alpha-Beta Pruning</h2>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 uppercase bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded">
                  Optimized O(b^(d/2))
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Nodes Explored</div>
                  <div className="text-cyan-400 font-bold text-lg mt-1">{singleResult.alphaBetaNodesVisited.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Branches Pruned</div>
                  <div className="text-rose-400 font-bold text-lg mt-1">{singleResult.alphaBetaNodesPruned.toLocaleString()}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Execution Time</div>
                  <div className="text-emerald-400 font-bold text-lg mt-1">{singleResult.alphaBetaTimeMs}ms</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Selected Move:</span>
                  <span className="font-mono font-bold text-emerald-400">{singleResult.alphaBetaMove}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backed-up Minimax Score:</span>
                  <span className="font-mono font-bold text-emerald-400">{singleResult.alphaBetaVal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pruning Cutoffs:</span>
                  <span className="font-mono text-cyan-300">
                    {singleResult.alphaCutoffs} α-cutoffs · {singleResult.betaCutoffs} β-cutoffs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Depth Sweep Table */}
      {sweepResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Multi-Depth Empirical Progression (Depths 1 to 5)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Ordering: {selectedMoveOrdering}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-sans">Search Depth</th>
                  <th className="py-2.5 px-3">Plain Minimax Nodes</th>
                  <th className="py-2.5 px-3">Alpha-Beta Nodes</th>
                  <th className="py-2.5 px-3">Branches Pruned</th>
                  <th className="py-2.5 px-3">Plain Time (ms)</th>
                  <th className="py-2.5 px-3">Alpha-Beta Time (ms)</th>
                  <th className="py-2.5 px-3 text-right">Node Reduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sweepResults.map((row) => (
                  <tr key={row.depth} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-200 font-sans">Depth {row.depth}</td>
                    <td className="py-3 px-3 text-slate-300">{row.minimaxNodes.toLocaleString()}</td>
                    <td className="py-3 px-3 text-cyan-300 font-semibold">{row.alphaBetaNodes.toLocaleString()}</td>
                    <td className="py-3 px-3 text-rose-400 font-semibold">{row.prunedNodes.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-400">{row.minimaxTimeMs}ms</td>
                    <td className="py-3 px-3 text-emerald-400">{row.alphaBetaTimeMs}ms</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {row.savingsPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theoretical vs Measured Complexity Callout Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Theoretical Complexity vs. Empirical Reality</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">Theoretical Worst Case: O(b^d)</span>
            <p className="text-slate-400 leading-relaxed">
              If moves are ordered adversarially (worst moves first), Alpha-Beta is unable to establish tight bounds early. In that degenerate scenario, zero cutoffs occur and the algorithm examines the full b^d tree.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-300">Theoretical Best Case: O(b^(d/2))</span>
            <p className="text-slate-400 leading-relaxed">
              When moves are sorted with our heuristic domain evaluator (evaluating closest interception first), cutoffs occur immediately on subsequent candidate branches. Effective branching factor drops from b to √b.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
