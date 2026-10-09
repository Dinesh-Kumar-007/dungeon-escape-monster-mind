import React, { useRef, useEffect } from 'react';
import { Direction, GameState, Position } from '../types/game';
import { isSamePos } from '../levels/dungeons';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleDot, Key, ShieldAlert } from 'lucide-react';

interface DungeonCanvasProps {
  gameState: GameState;
  onHeroMove: (dir: Direction) => void;
  isAiThinking: boolean;
  highlightMonsterMove?: Direction | null;
}

export const DungeonCanvas: React.FC<DungeonCanvasProps> = ({
  gameState,
  onHeroMove,
  isAiThinking,
  highlightMonsterMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, grid, hero, monster, keyPos, exitPos, hasKey } = gameState;
    const cellSize = Math.floor(Math.min(500 / width, 500 / height));
    const renderWidth = width * cellSize;
    const renderHeight = height * cellSize;

    canvas.width = renderWidth;
    canvas.height = renderHeight;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, renderWidth, renderHeight);

    // 1. Draw Tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        if (cell === 'wall') {
          // Wall tile: dark obsidian brick
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px, py, cellSize, cellSize);

          // Inner bevel
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

          // Brick texture details
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 6, py + (cellSize / 2) - 1, cellSize - 12, 2);
        } else {
          // Floor tile: stone slab
          const isEven = (x + y) % 2 === 0;
          ctx.fillStyle = isEven ? '#0f172a' : '#131d31';
          ctx.fillRect(px, py, cellSize, cellSize);

          // Tile border
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);

          // Subtle stone speckles
          ctx.fillStyle = isEven ? '#1e293b' : '#24324d';
          ctx.fillRect(px + 4, py + 4, 2, 2);
          ctx.fillRect(px + cellSize - 8, py + cellSize - 8, 2, 2);
        }

        // Draw Trap
        if (cell === 'trap') {
          // Trap hazard plate
          ctx.fillStyle = '#3f1515';
          ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);

          // Spikes (sharp metallic triangles)
          ctx.fillStyle = '#ef4444';
          const spikeCount = 3;
          const step = (cellSize - 16) / spikeCount;
          for (let s = 0; s < spikeCount; s++) {
            ctx.beginPath();
            ctx.moveTo(px + 8 + s * step, py + cellSize - 8);
            ctx.lineTo(px + 8 + s * step + step / 2, py + 10);
            ctx.lineTo(px + 8 + (s + 1) * step, py + cellSize - 8);
            ctx.fill();
          }
          // Warning outline
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
        }
      }
    }

    // 2. Draw Exit
    {
      const ex = exitPos.x * cellSize;
      const ey = exitPos.y * cellSize;

      if (hasKey) {
        // Open unlocked exit: glowing emerald / sunlight portal
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(ex + 4, ey + 4, cellSize - 8, cellSize - 8);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ex + 4, ey + 4, cellSize - 8, cellSize - 8);

        // Portal glow
        const glow = ctx.createRadialGradient(
          ex + cellSize / 2, ey + cellSize / 2, 2,
          ex + cellSize / 2, ey + cellSize / 2, cellSize / 2
        );
        glow.addColorStop(0, '#34d399');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(ex + 4, ey + 4, cellSize - 8, cellSize - 8);

        // Exit sign text
        ctx.fillStyle = '#ecfdf5';
        ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.22))}px Plus Jakarta Sans, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ESCAPE', ex + cellSize / 2, ey + cellSize / 2);
      } else {
        // Locked door: iron portcullis with padlock
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(ex + 4, ey + 4, cellSize - 8, cellSize - 8);

        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.strokeRect(ex + 4, ey + 4, cellSize - 8, cellSize - 8);

        // Iron bars
        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 2;
        for (let b = 1; b <= 3; b++) {
          ctx.beginPath();
          ctx.moveTo(ex + (cellSize * b) / 4, ey + 6);
          ctx.lineTo(ex + (cellSize * b) / 4, ey + cellSize - 6);
          ctx.stroke();
        }

        // Lock icon in center
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ex + cellSize / 2, ey + cellSize / 2 - 3, 5, Math.PI, 0, false);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#d97706';
        ctx.stroke();
        ctx.fillRect(ex + cellSize / 2 - 6, ey + cellSize / 2 - 2, 12, 10);
      }
    }

    // 3. Draw Key (if not yet held)
    if (keyPos && !hasKey) {
      const kx = keyPos.x * cellSize + cellSize / 2;
      const ky = keyPos.y * cellSize + cellSize / 2;

      // Golden aura
      const aura = ctx.createRadialGradient(kx, ky, 2, kx, ky, cellSize * 0.4);
      aura.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
      aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(kx, ky, cellSize * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Skeleton Key drawing
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;

      // Key Ring
      ctx.beginPath();
      ctx.arc(kx - 5, ky, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Key Shaft
      ctx.beginPath();
      ctx.moveTo(kx + 1, ky);
      ctx.lineTo(kx + 12, ky);
      // Key teeth
      ctx.lineTo(kx + 12, ky + 5);
      ctx.moveTo(kx + 8, ky);
      ctx.lineTo(kx + 8, ky + 4);
      ctx.stroke();
    }

    // 4. Draw Monster (MAX Player)
    {
      const mx = monster.x * cellSize + cellSize / 2;
      const my = monster.y * cellSize + cellSize / 2;
      const r = cellSize * 0.36;

      // Monster threat halo
      const monsterAura = ctx.createRadialGradient(mx, my, 2, mx, my, cellSize * 0.5);
      monsterAura.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      monsterAura.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = monsterAura;
      ctx.beginPath();
      ctx.arc(mx, my, cellSize * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Body (Demonic Crimson)
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Horns
      ctx.fillStyle = '#7f1d1d';
      // Left horn
      ctx.beginPath();
      ctx.moveTo(mx - r * 0.7, my - r * 0.2);
      ctx.lineTo(mx - r * 1.1, my - r * 0.9);
      ctx.lineTo(mx - r * 0.3, my - r * 0.6);
      ctx.fill();
      // Right horn
      ctx.beginPath();
      ctx.moveTo(mx + r * 0.7, my - r * 0.2);
      ctx.lineTo(mx + r * 1.1, my - r * 0.9);
      ctx.lineTo(mx + r * 0.3, my - r * 0.6);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(mx - r * 0.35, my - r * 0.1, 3.5, 0, Math.PI * 2);
      ctx.arc(mx + r * 0.35, my - r * 0.1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Slit pupils
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(mx - r * 0.35 - 1, my - r * 0.1 - 3, 2, 6);
      ctx.fillRect(mx + r * 0.35 - 1, my - r * 0.1 - 3, 2, 6);

      // Fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(mx - 4, my + r * 0.3);
      ctx.lineTo(mx - 2, my + r * 0.55);
      ctx.lineTo(mx, my + r * 0.3);
      ctx.lineTo(mx + 2, my + r * 0.55);
      ctx.lineTo(mx + 4, my + r * 0.3);
      ctx.fill();

      // Monster label badge (MAX AI)
      ctx.fillStyle = '#fee2e2';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MAX (AI)', mx, my - r - 3);
    }

    // 5. Draw Hero (Player - MIN)
    {
      const hx = hero.x * cellSize + cellSize / 2;
      const hy = hero.y * cellSize + cellSize / 2;
      const r = cellSize * 0.34;

      // Hero Blue/Cyan Aura
      const heroAura = ctx.createRadialGradient(hx, hy, 2, hx, hy, cellSize * 0.45);
      heroAura.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      heroAura.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = heroAura;
      ctx.beginPath();
      ctx.arc(hx, hy, cellSize * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Body (Knight armor / Tunic)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Knight Helmet visor / Eyes
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(hx - r * 0.5, hy - r * 0.2, r, 5);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(hx - r * 0.3, hy - r * 0.15, 3, 3);
      ctx.fillRect(hx + r * 0.1, hy - r * 0.15, 3, 3);

      // Sword
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx + r * 0.4, hy + r * 0.4);
      ctx.lineTo(hx + r * 0.9, hy - r * 0.5);
      ctx.stroke();

      // Sword guard & hilt
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx + r * 0.25, hy + r * 0.15);
      ctx.lineTo(hx + r * 0.6, hy + r * 0.45);
      ctx.stroke();

      // If holding key, show key badge above hero
      if (hasKey) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(hx + r * 0.7, hy - r * 0.7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Hero label badge (MIN)
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HERO (MIN)', hx, hy - r - 3);
    }
  }, [gameState, highlightMonsterMove]);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Board Canvas Container */}
      <div className="relative p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-inner cursor-pointer"
          tabIndex={0}
        />

        {/* Turn Status Overlay Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/85 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 backdrop-blur-md">
            <span>Turn {gameState.turnCount}</span>
            <span className="text-slate-500">·</span>
            <span className={gameState.turn === 'hero' ? 'text-cyan-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {gameState.turn === 'hero' ? 'Hero Move (MIN)' : 'Monster Thinking (MAX)...'}
            </span>
          </div>

          {gameState.hasKey && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs font-semibold text-amber-300 backdrop-blur-md">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Key Collected! Head to Exit</span>
            </div>
          )}
        </div>

        {/* Game Over Banner */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {gameState.winner === 'hero' ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl">
                  🏆
                </div>
                <h3 className="text-2xl font-bold text-emerald-400">Dungeon Escaped!</h3>
                <p className="text-sm text-slate-300 max-w-xs">{gameState.gameOverReason}</p>
                <p className="text-xs text-emerald-300/80 font-mono">Hero (MIN player) achieved terminal utility!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-3xl">
                  💀
                </div>
                <h3 className="text-2xl font-bold text-rose-400">Monster Victory</h3>
                <p className="text-sm text-slate-300 max-w-xs">{gameState.gameOverReason}</p>
                <p className="text-xs text-rose-300/80 font-mono">Monster (MAX player) maximized utility (+10,000)!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive D-Pad & Controls for on-screen touch and mouse */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
          <span>Controls:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300">WASD</kbd>
          <span>or</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300">Arrow Keys</kbd>
        </div>

        {/* Tactile D-Pad buttons */}
        <div className="grid grid-cols-3 gap-1.5 w-44 pt-1">
          <div />
          <button
            onClick={() => onHeroMove('UP')}
            disabled={gameState.turn !== 'hero' || gameState.isGameOver}
            aria-label="Move Up"
            className="flex items-center justify-center h-11 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-lg border border-slate-700/80 shadow-md transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            onClick={() => onHeroMove('LEFT')}
            disabled={gameState.turn !== 'hero' || gameState.isGameOver}
            aria-label="Move Left"
            className="flex items-center justify-center h-11 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-lg border border-slate-700/80 shadow-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onHeroMove('WAIT')}
            disabled={gameState.turn !== 'hero' || gameState.isGameOver}
            title="Wait / Pass Turn"
            aria-label="Wait turn"
            className="flex flex-col items-center justify-center h-11 bg-slate-850 hover:bg-slate-750 active:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-400 hover:text-cyan-300 rounded-lg border border-cyan-800/40 shadow-md text-[10px] font-mono transition-colors"
          >
            <CircleDot className="w-4 h-4 mb-0.5" />
            <span>WAIT</span>
          </button>

          <button
            onClick={() => onHeroMove('RIGHT')}
            disabled={gameState.turn !== 'hero' || gameState.isGameOver}
            aria-label="Move Right"
            className="flex items-center justify-center h-11 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-lg border border-slate-700/80 shadow-md transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            onClick={() => onHeroMove('DOWN')}
            disabled={gameState.turn !== 'hero' || gameState.isGameOver}
            aria-label="Move Down"
            className="flex items-center justify-center h-11 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white rounded-lg border border-slate-700/80 shadow-md transition-colors"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
