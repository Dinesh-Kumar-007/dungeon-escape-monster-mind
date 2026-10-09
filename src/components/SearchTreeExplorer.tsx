import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Direction,
  HeuristicWeights,
  LevelConfig,
  MoveOrderingStrategy,
  SearchNode,
  SearchResult,
  SimpleState,
} from '../types/game';
import { runAlphaBetaSearch } from '../ai/minimax';
import { computeTreeLayout, LayoutedNode } from '../utils/treeLayout';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scissors,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SearchTreeExplorerProps {
  currentSearchResult: SearchResult | null;
  currentState: SimpleState;
  currentLevel: LevelConfig;
  weights: HeuristicWeights;
  searchDepth: number;
  onUpdateSearchResult?: (res: SearchResult) => void;
  activeTraceNodeId?: string | null;
}

export const SearchTreeExplorer: React.FC<SearchTreeExplorerProps> = ({
  currentSearchResult,
  currentState,
  currentLevel,
  weights,
  searchDepth: initialSearchDepth,
  onUpdateSearchResult,
  activeTraceNodeId,
}) => {
  const [depth, setDepth] = useState<number>(initialSearchDepth);
  const [moveOrdering, setMoveOrdering] = useState<MoveOrderingStrategy>('heuristic');

  // Local search result or parent-provided search result
  const [localSearchResult, setLocalSearchResult] = useState<SearchResult | null>(() => {
    if (currentSearchResult) return currentSearchResult;
    // Auto-generate on initial state if none exists yet
    return runAlphaBetaSearch(currentState, {
      depth: initialSearchDepth,
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

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute Layout
  const layout = useMemo(() => {
    if (!searchResult || !searchResult.rootId || !searchResult.nodes[searchResult.rootId]) {
      return null;
    }
    return computeTreeLayout(searchResult.rootId, searchResult.nodes, 105, 115);
  }, [searchResult]);

  // Center Root node on layout change
  useEffect(() => {
    if (layout && containerRef.current && searchResult) {
      const containerW = containerRef.current.clientWidth || 900;
      const root = layout.layoutedNodes[searchResult.rootId];
      if (root) {
        setPan({ x: containerW / 2 - root.x * 0.85, y: 35 });
        setZoom(0.85);
      }
    }
  }, [layout, searchResult]);

  // Sync external active trace node if provided
  useEffect(() => {
    if (activeTraceNodeId) {
      setSelectedNodeId(activeTraceNodeId);
      if (layout?.layoutedNodes[activeTraceNodeId] && containerRef.current) {
        const node = layout.layoutedNodes[activeTraceNodeId];
        const containerW = containerRef.current.clientWidth || 900;
        const containerH = containerRef.current.clientHeight || 500;
        setPan({
          x: containerW / 2 - node.x * zoom,
          y: containerH / 2 - node.y * zoom,
        });
      }
    }
  }, [activeTraceNodeId, layout, zoom]);

  // Re-run tree search with customized depth or move ordering
  const handleRunSearch = () => {
    const res = runAlphaBetaSearch(currentState, {
      depth,
      weights,
      width: currentLevel.width,
      height: currentLevel.height,
      walls: currentLevel.walls,
      traps: currentLevel.traps,
      keyPos: currentLevel.keyPos,
      exitPos: currentLevel.exitPos,
      moveOrdering,
    });
    setLocalSearchResult(res);
    setStepIndex(0);
    setSelectedNodeId(res.rootId);
    if (onUpdateSearchResult) {
      onUpdateSearchResult(res);
    }
  };

  // Stepper Autoplay Loop
  useEffect(() => {
    if (!isPlaying || !searchResult) return;

    if (stepIndex >= searchResult.trace.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      const nextStep = searchResult.trace[nextIdx];
      if (nextStep) {
        setSelectedNodeId(nextStep.nodeId);
        soundManager.playStepSound(nextStep.type);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, searchResult]);

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (stepIndex > 0 && searchResult) {
      const nextIdx = stepIndex - 1;
      setStepIndex(nextIdx);
      const step = searchResult.trace[nextIdx];
      if (step) setSelectedNodeId(step.nodeId);
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (searchResult && stepIndex < searchResult.trace.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      const step = searchResult.trace[nextIdx];
      if (step) setSelectedNodeId(step.nodeId);
    }
  };

  const handleResetStep = () => {
    setIsPlaying(false);
    setStepIndex(0);
    if (searchResult) {
      setSelectedNodeId(searchResult.rootId);
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.2, prev * factor)));
  };

  const handleResetZoomPan = () => {
    if (layout && containerRef.current && searchResult) {
      const containerW = containerRef.current.clientWidth || 900;
      const root = layout.layoutedNodes[searchResult.rootId];
      if (root) {
        setPan({ x: containerW / 2 - root.x * 0.85, y: 35 });
        setZoom(0.85);
      }
    }
  };

  const selectedNode = selectedNodeId && searchResult ? searchResult.nodes[selectedNodeId] : null;
  const currentStep = searchResult && searchResult.trace[stepIndex] ? searchResult.trace[stepIndex] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner and Search Parameter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>SEARCH TREE EXPLORER</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Full Minimax & Alpha-Beta Graph Visualization</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Live Search Tree & Pruned Branch Graph
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Visualizes real algorithm execution on the current dungeon state. Pan and zoom around the tree, inspect leaf evaluations, and trace backed-up Minimax values and pruned cutoffs.
            </p>
          </div>

          {searchResult && (
            <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl">
              <div>
                <span className="text-slate-500 uppercase font-sans text-[10px]">Nodes Explored</span>
                <div className="text-slate-200 font-bold">{searchResult.stats.totalNodesExplored}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 uppercase font-sans text-[10px]">Branches Pruned</span>
                <div className="text-rose-400 font-bold">{searchResult.stats.totalNodesPruned}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 uppercase font-sans text-[10px]">Best Move</span>
                <div className="text-emerald-400 font-bold">{searchResult.bestMove}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tree Execution Parameter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Search Depth:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                aria-label="Search Depth"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <option value={1}>Depth 1 (Plies: 1)</option>
                <option value={2}>Depth 2 (Plies: 2)</option>
                <option value={3}>Depth 3 (Plies: 3)</option>
                <option value={4}>Depth 4 (Plies: 4)</option>
                <option value={5}>Depth 5 (Plies: 5)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Move Ordering:</span>
              <select
                value={moveOrdering}
                onChange={(e) => setMoveOrdering(e.target.value as MoveOrderingStrategy)}
                aria-label="Move Ordering Strategy"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-xs focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <option value="heuristic">Optimal Heuristic (Maximum Pruning)</option>
                <option value="natural">Natural Order (Unsorted)</option>
                <option value="reverse">Reverse Order (Worst-Case Test)</option>
              </select>
            </div>

            <button
              onClick={handleRunSearch}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Fresh Tree</span>
            </button>
          </div>

          {/* Stepper Autoplay Bar */}
          {searchResult && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">
                Step {stepIndex + 1}/{searchResult.trace.length}
              </span>
              <button
                onClick={handleResetStep}
                className="p-1 hover:text-white text-slate-400"
                title="Reset to Root"
                aria-label="Reset trace to step 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleStepPrev}
                disabled={stepIndex <= 0}
                className="p-1 hover:text-white text-slate-400 disabled:opacity-30"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 text-cyan-400 hover:text-cyan-300"
                aria-label={isPlaying ? 'Pause trace' : 'Autoplay trace'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleStepNext}
                disabled={stepIndex >= searchResult.trace.length - 1}
                className="p-1 hover:text-white text-slate-400 disabled:opacity-30"
                aria-label="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Graph Viewer & Node Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Tree Canvas Container (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Canvas Controls Header & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-4 text-slate-300 font-medium text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400 inline-block" />
                <span>MAX (Monster)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500/80 border border-cyan-400 inline-block" />
                <span>MIN (Hero)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-rose-400" />
                <span>Pruned Branch</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((prev) => Math.min(2.5, prev * 1.15))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(0.2, prev * 0.85))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoomPan}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] px-2 font-medium"
                title="Reset View"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Graph Viewport */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="relative w-full h-[540px] bg-[#070b14] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          >
            {layout && searchResult && (
              <svg
                width="100%"
                height="100%"
                className="w-full h-full pointer-events-auto"
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Draw Connecting Edges */}
                  {Object.values(layout.layoutedNodes).map((node) => {
                    return node.childIds.map((cId) => {
                      const child = layout.layoutedNodes[cId];
                      if (!child) return null;
                      const isPrunedEdge = child.isPruned;
                      const isSelectedEdge =
                        selectedNode && (selectedNode.id === child.id || selectedNode.id === node.id);

                      return (
                        <g key={`${node.id}->${child.id}`}>
                          <line
                            x1={node.x}
                            y1={node.y}
                            x2={child.x}
                            y2={child.y}
                            stroke={
                              isPrunedEdge
                                ? 'rgba(239, 68, 68, 0.4)'
                                : isSelectedEdge
                                ? 'rgba(34, 211, 238, 0.9)'
                                : 'rgba(51, 65, 85, 0.6)'
                            }
                            strokeWidth={isPrunedEdge ? 1.5 : isSelectedEdge ? 2.5 : 1.5}
                            strokeDasharray={isPrunedEdge ? '4 3' : undefined}
                          />
                          {/* Edge Move Action Label */}
                          {child.move && (
                            <text
                              x={(node.x + child.x) / 2}
                              y={(node.y + child.y) / 2 - 4}
                              fill={isPrunedEdge ? '#ef4444' : '#94a3b8'}
                              fontSize={9}
                              fontFamily="JetBrains Mono, monospace"
                              textAnchor="middle"
                            >
                              {child.move}
                            </text>
                          )}
                        </g>
                      );
                    });
                  })}

                  {/* Draw Nodes */}
                  {Object.values(layout.layoutedNodes).map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const r = 24;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedNodeId(node.id)}
                        className="cursor-pointer transition-transform"
                      >
                        {/* Glow on selection */}
                        {isSelected && (
                          <circle
                            r={r + 6}
                            fill="none"
                            stroke={node.isMax ? '#f43f5e' : '#38bdf8'}
                            strokeWidth={3}
                            opacity={0.8}
                          />
                        )}

                        {/* Node Body */}
                        <circle
                          r={r}
                          fill={
                            node.isPruned
                              ? '#1f1315'
                              : node.isMax
                              ? '#3b0d14'
                              : '#082f49'
                          }
                          stroke={
                            node.isPruned
                              ? '#ef4444'
                              : node.isMax
                              ? '#f43f5e'
                              : '#38bdf8'
                          }
                          strokeWidth={node.isPruned ? 1.5 : 2}
                          strokeDasharray={node.isPruned ? '3 2' : undefined}
                        />

                        {/* Node Label / Value */}
                        {node.isPruned ? (
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ef4444"
                            fontSize={11}
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight="bold"
                          >
                            CUT
                          </text>
                        ) : (
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#f8fafc"
                            fontSize={10}
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight="bold"
                          >
                            {node.value !== null ? node.value : '?'}
                          </text>
                        )}

                        {/* Depth / Ply Kicker */}
                        <text
                          y={r + 12}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize={9}
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.isMax ? 'MAX' : 'MIN'} d={node.depth}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>

          {/* Current Step Explanation Ribbon */}
          {currentStep && (
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-bold shrink-0">
                [{currentStep.type}]
              </span>
              <p className="text-slate-300 text-xs truncate">{currentStep.explanation}</p>
            </div>
          )}
        </div>

        {/* Right: Node Inspector Details Card (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Node Inspector</span>
            </h2>
            {selectedNode && (
              <span className="font-mono text-xs text-slate-400">
                {selectedNode.id}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Decision Role:</span>
                  <span className={`font-semibold ${selectedNode.isMax ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {selectedNode.isMax ? 'MAX Player (Monster)' : 'MIN Player (Hero)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Search Ply:</span>
                  <span className="font-mono text-slate-200">Depth {selectedNode.depth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transition Action:</span>
                  <span className="font-mono font-bold text-amber-300">{selectedNode.move || 'ROOT STATE'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Window [α, β]:</span>
                  <span className="font-mono text-slate-200">
                    [{selectedNode.alpha === -Infinity ? '-∞' : selectedNode.alpha}, {selectedNode.beta === Infinity ? '+∞' : selectedNode.beta}]
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Backed-up Minimax Score:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedNode.value !== null ? selectedNode.value : 'In Progress'}
                  </span>
                </div>
              </div>

              {selectedNode.isPruned && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Subtree Pruned (Cutoff)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedNode.pruneReason || 'Pruned because alpha >= beta bounds were breached.'}
                  </p>
                </div>
              )}

              {selectedNode.isLeaf && selectedNode.heuristicBreakdown && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Leaf Static Evaluation Terms
                  </span>
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
                    {selectedNode.heuristicBreakdown.terms.map((term, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[170px]">{term.label}:</span>
                        <span className={term.contribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {term.contribution >= 0 ? `+${term.contribution}` : term.contribution}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between font-bold text-white">
                      <span>Total Score:</span>
                      <span className="text-emerald-400">{selectedNode.heuristicBreakdown.score}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* State Preview summary */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Monster Position:</span>
                  <span className="font-mono text-slate-200">({selectedNode.state.monster.x}, {selectedNode.state.monster.y})</span>
                </div>
                <div className="flex justify-between">
                  <span>Hero Position:</span>
                  <span className="font-mono text-slate-200">({selectedNode.state.hero.x}, {selectedNode.state.hero.y})</span>
                </div>
                <div className="flex justify-between">
                  <span>Has Key:</span>
                  <span className="text-slate-200">{selectedNode.state.hasKey ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Click any node in the search tree graph to inspect its minimax value, alpha-beta window, and evaluation breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
