import React, { useState } from 'react';
import { NavigationSection } from '../types/game';
import {
  Brain,
  Scissors,
  Layers,
  Sliders,
  Gauge,
  ArrowRight,
  CheckCircle2,
  Code2,
  GitBranch,
  Shield,
  Zap,
} from 'lucide-react';

interface AiLabProps {
  onNavigate: (section: NavigationSection) => void;
}

export const AiLab: React.FC<AiLabProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<
    'minimax' | 'alphabeta' | 'state' | 'evaluation' | 'depth'
  >('minimax');

  // Interactive worked example state in Minimax tab
  const [workedExampleChoice, setWorkedExampleChoice] = useState<number | null>(null);

  // Interactive depth simulator state in Depth tab
  const [testDepth, setTestDepth] = useState<number>(3);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <span>AI LAB</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Algorithmic Foundations of Dungeon Escape</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Understanding the Monster Mind
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Explore the exact adversarial decision-making algorithms running inside Dungeon Escape: Monster Mind.
            Learn how the zero-sum game tree is structured, evaluated, and pruned without losing optimality.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('tree')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border border-slate-700 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Open Tree Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('minimax')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'minimax'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>1. Minimax Algorithm</span>
        </button>

        <button
          onClick={() => setActiveTab('alphabeta')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'alphabeta'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Scissors className="w-4 h-4 text-rose-400" />
          <span>2. Alpha-Beta Pruning</span>
        </button>

        <button
          onClick={() => setActiveTab('state')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'state'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>3. Game State & Search</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'evaluation'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>4. Evaluation Function</span>
        </button>

        <button
          onClick={() => setActiveTab('depth')}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'depth'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Gauge className="w-4 h-4 text-purple-400" />
          <span>5. Search Depth & Horizon</span>
        </button>
      </div>

      {/* Tab 1: Minimax */}
      {activeTab === 'minimax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Zero-Sum Adversarial Decision Theory</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Minimax operates on the assumption that two rational agents face each other with directly opposing objectives:
              </p>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-rose-400">MAX Player (The Monster)</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strives to <strong>maximize</strong> the game utility score. The monster selects actions that yield the highest possible guaranteed score, anticipating optimal evasive play from the hero.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-cyan-400">MIN Player (The Hero)</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strives to <strong>minimize</strong> the monster's score. The hero wants to escape or keep the monster at maximum distance, choosing moves that keep the utility as low as possible.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Value Propagation:</strong> The search tree recursively traverses future plies until a terminal state or search depth limit is met. Terminal leaves are evaluated statically; then values propagate upward—taking the <code className="text-rose-300">max</code> at Monster nodes and the <code className="text-cyan-300">min</code> at Hero nodes.
              </p>
            </div>

            {/* Interactive Worked Example */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>Interactive Worked Example</span>
              </h2>
              <p className="text-xs text-slate-400">
                Suppose the Monster has two candidate moves: <strong>Left</strong> or <strong>Right</strong>. At each branch, the Hero responds with their best counter-move:
              </p>

              {/* Visual Tree Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-center">
                <div className="inline-block px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-bold">
                  Root MAX (Monster Choice) → Value: +40
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {/* Left Subtree */}
                  <div
                    onClick={() => setWorkedExampleChoice(1)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      workedExampleChoice === 1
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-cyan-400">Branch A: Move Left</div>
                    <div className="text-[11px] text-slate-400 mt-1">Hero (MIN) chooses min(+20, +40)</div>
                    <div className="text-sm font-mono font-bold text-cyan-300 mt-1">Backed-up: +20</div>
                    <div className="flex justify-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      <span className="p-1 bg-slate-950 rounded border border-slate-800">+20</span>
                      <span className="p-1 bg-slate-950 rounded border border-slate-800">+40</span>
                    </div>
                  </div>

                  {/* Right Subtree */}
                  <div
                    onClick={() => setWorkedExampleChoice(2)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      workedExampleChoice === 2
                        ? 'bg-rose-500/15 border-rose-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-rose-400">Branch B: Move Right</div>
                    <div className="text-[11px] text-slate-400 mt-1">Hero (MIN) chooses min(+80, +40)</div>
                    <div className="text-sm font-mono font-bold text-rose-300 mt-1">Backed-up: +40</div>
                    <div className="flex justify-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      <span className="p-1 bg-slate-950 rounded border border-slate-800">+80</span>
                      <span className="p-1 bg-slate-950 rounded border border-slate-800">+40</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-lg text-xs text-slate-300 leading-relaxed text-left border border-slate-800">
                  <strong>Decision:</strong> Root MAX evaluates <code className="text-amber-300 font-mono">max(+20, +40) = +40</code>. The Monster chooses <strong>Branch B (Right)</strong> because even under the Hero's best defense, it guarantees a superior outcome of +40.
                </div>
              </div>
            </div>
          </div>

          {/* Pseudocode Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Minimax Recursive Pseudocode</span>
            </h2>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`function MINIMAX(state, depth, isMaximizing):
    if depth == 0 or isTerminal(state):
        return EVALUATE(state)

    if isMaximizing:  // MAX Player: Monster's turn
        maxEval = -Infinity
        for each move in GetLegalMonsterMoves(state):
            childState = ApplyMove(state, move)
            eval = MINIMAX(childState, depth - 1, false)
            maxEval = max(maxEval, eval)
        return maxEval
    else:             // MIN Player: Hero's turn
        minEval = +Infinity
        for each move in GetLegalHeroMoves(state):
            childState = ApplyMove(state, move)
            eval = MINIMAX(childState, depth - 1, true)
            minEval = min(minEval, eval)
        return minEval`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Alpha-Beta Pruning */}
      {activeTab === 'alphabeta' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-400" />
                <span>The Alpha-Beta Pruning Principle</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ordinary Minimax evaluates every node in the game tree ($O(b^d)$ nodes). Alpha-Beta Pruning maintains two dynamic bounds along the search path:
              </p>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400">Alpha (α) — MAX's Guaranteed Floor</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The highest utility value that MAX (Monster) is already guaranteed to achieve along any choice explored so far. Initialized to <code className="text-amber-300">-∞</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-cyan-400">Beta (β) — MIN's Guaranteed Ceiling</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The lowest utility value that MIN (Hero) is already guaranteed to achieve along any choice explored so far. Initialized to <code className="text-cyan-300">+∞</code>.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-400">The Cutoff Condition (β ≤ α)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Whenever <code className="font-mono font-bold text-rose-300">β ≤ α</code>, the current branch is discarded immediately. Because the opposing player already has a strictly better move elsewhere in the tree, this subtree can never influence the final decision.
                </p>
              </div>
            </div>

            {/* Proof & Efficiency */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Why Pruning Preserves Exact Minimax Results</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pruning is strictly loss-free: it produces the <strong>identical decision and backed-up value</strong> as brute-force Minimax.
              </p>
              <div className="space-y-3 text-xs text-slate-400">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="font-semibold text-slate-200">Mathematical Invariance</div>
                  <p className="mt-1 leading-relaxed">
                    If MAX knows it can already secure <code className="text-amber-300">α = 60</code>, and while exploring a new move MIN can force a score <code className="text-cyan-300">≤ 40</code>, MAX will never pick this new move. Exploring further children of this node is mathematically pointless.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="font-semibold text-slate-200">Complexity: Best Case vs Worst Case</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-emerald-400 font-bold">Best Case: O(b^(d/2))</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">With optimal move ordering, searches twice as deep!</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-400 font-bold">Worst Case: O(b^d)</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">If moves evaluated from worst to best, no cutoffs occur.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pseudocode with Alpha-Beta */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Alpha-Beta Pruning Implementation</span>
            </h2>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`function ALPHA_BETA(state, depth, α, β, isMaximizing):
    if depth == 0 or isTerminal(state):
        return EVALUATE(state)

    if isMaximizing:  // MAX Player: Monster
        maxEval = -Infinity
        for each move in GetLegalMonsterMoves(state):
            childState = ApplyMove(state, move)
            eval = ALPHA_BETA(childState, depth - 1, α, β, false)
            maxEval = max(maxEval, eval)
            α = max(α, eval)
            if β <= α:
                break // Cutoff: Hero (MIN above) would never permit this branch
        return maxEval
    else:             // MIN Player: Hero
        minEval = +Infinity
        for each move in GetLegalHeroMoves(state):
            childState = ApplyMove(state, move)
            eval = ALPHA_BETA(childState, depth - 1, α, β, true)
            minEval = min(minEval, eval)
            β = min(β, eval)
            if β <= α:
                break // Cutoff: Monster (MAX above) already has a superior option
        return minEval`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Game State and Search */}
      {activeTab === 'state' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Formal Game Formulation: State, Actions & Transitions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Dungeon Escape is formally modeled as a deterministic, discrete, perfect-information adversarial search problem:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 font-mono">1. State Representation S</span>
              <p className="text-slate-400 leading-relaxed">
                A state tuple <code className="text-slate-200">S = (hero, monster, hasKey, heroAlive)</code> plus static environment matrices (grid geometry, walls, traps, exit location).
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 font-mono">2. Actions Function Actions(S)</span>
              <p className="text-slate-400 leading-relaxed">
                Legal directions: <code className="text-slate-200">&#123;UP, DOWN, LEFT, RIGHT, WAIT&#125;</code>. A move is legal if the target coordinate is inside grid boundaries and is not an impassable wall or locked exit.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 font-mono">3. Transition Model Result(S, a)</span>
              <p className="text-slate-400 leading-relaxed">
                Deterministic: updates player coordinate to target cell. If Hero enters Key cell, <code className="text-slate-200">hasKey = true</code>. If Hero steps on Trap, <code className="text-slate-200">heroAlive = false</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-300 font-mono">4. Terminal Test & Utilities</span>
              <p className="text-slate-400 leading-relaxed">
                Terminal if: (a) Monster catches Hero (+10,000), (b) Hero dies on Trap (+8,000), (c) Hero reaches Exit with Key (-10,000). Depth cutoffs occur at limit plies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Evaluation Function */}
      {activeTab === 'evaluation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>The Monster's Linear Heuristic Evaluation Function</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Because game trees cannot be explored to full exhaustion in real-time, non-terminal leaves are scored with a domain-specific evaluation function from the Monster's perspective.
              </p>
            </div>

            <button
              onClick={() => onNavigate('heuristics')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Inspect & Tune Live Weights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 space-y-1">
            <div className="text-amber-300 font-bold">h(S) = W_catch · Proximity(M, H)</div>
            <div className="text-cyan-300">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (hasKey ? W_exit · Dist(H, Exit) : W_key · Dist(H, Key))
            </div>
            <div className="text-emerald-300">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ W_guard · GuardProximity(M, Objective)
            </div>
            <div className="text-rose-300">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- W_mobility · SafeCorridors(H)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-400">1. Hero Pursuit (Catch Proximity)</span>
              <p className="text-slate-400 leading-relaxed">
                Shortest BFS distance between Monster and Hero. Shorter distance yields a higher positive score.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-cyan-400">2. Objective Denial (Key / Exit)</span>
              <p className="text-slate-400 leading-relaxed">
                Monster gains utility when the Hero is kept far away from the active objective (the key first, then the exit).
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-400">3. Chokepoint & Objective Guarding</span>
              <p className="text-slate-400 leading-relaxed">
                Incentivizes the Monster to position itself along corridors between the Hero and the key/portal.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-rose-400">4. Mobility & Cornering</span>
              <p className="text-slate-400 leading-relaxed">
                Penalizes positions where the Hero has multiple open escape corridors; rewards cornering the hero into dead ends.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-purple-400">5. Terminal Catch Bonus</span>
              <p className="text-slate-400 leading-relaxed">
                Catching hero grants +10,000 minus a small depth penalty to prioritize the quickest interception path.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-red-400">6. Hero Escape Penalty</span>
              <p className="text-slate-400 leading-relaxed">
                Hero escaping through exit yields -10,000, ensuring the monster avoids any line that allows hero egress.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Search Depth */}
      {activeTab === 'depth' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span>Search Depth, Horizon Effect & Complexity</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In adversarial search, depth $d$ represents the number of half-moves (plies) projected into the future. Each additional ply multiplies the branch count exponentially:
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Interactive Depth Explorer</span>
              <span className="font-mono text-xs font-bold text-amber-400">Depth {testDepth} Plies</span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              value={testDepth}
              onChange={(e) => setTestDepth(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Theoretical Unpruned Nodes</div>
                <div className="text-slate-200 text-base font-bold mt-1">
                  ≈ {Math.round(Array.from({ length: testDepth + 1 }, (_, i) => Math.pow(3.5, i)).reduce((a, b) => a + b, 0)).toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Alpha-Beta Nodes (Best Case)</div>
                <div className="text-emerald-400 text-base font-bold mt-1">
                  ≈ {Math.round(Array.from({ length: testDepth + 1 }, (_, i) => Math.pow(3.5, i / 2)).reduce((a, b) => a + b, 0)).toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Foresight Horizon</div>
                <div className="text-cyan-400 text-base font-bold mt-1">
                  {testDepth === 1 && '1 Half-move (Greedy)'}
                  {testDepth === 2 && '1 Round (Hero reply)'}
                  {testDepth === 3 && '1.5 Rounds (Tactical)'}
                  {testDepth === 4 && '2 Full Rounds (Strategic)'}
                  {testDepth === 5 && '2.5 Rounds (Deep Trap)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
