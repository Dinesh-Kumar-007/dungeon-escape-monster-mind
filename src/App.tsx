import React, { useState, useEffect, useCallback } from 'react';
import { DUNGEON_LEVELS, isSamePos } from './levels/dungeons';
import {
  CellType,
  Direction,
  GameState,
  HeuristicWeights,
  LevelConfig,
  NavigationSection,
  SearchResult,
} from './types/game';
import { DEFAULT_HEURISTIC_WEIGHTS } from './ai/evaluation';
import { runAlphaBetaSearch } from './ai/minimax';
import { DIRECTIONS, applyMove } from './utils/pathfinding';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { GameArena } from './components/GameArena';
import { AiLab } from './components/AiLab';
import { SearchTreeExplorer } from './components/SearchTreeExplorer';
import { StepDebugger } from './components/StepDebugger';
import { HeuristicInspectorPage } from './components/HeuristicInspectorPage';
import { AiPerformancePage } from './components/AiPerformancePage';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavigationSection>('arena');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(DUNGEON_LEVELS[0]);
  const [searchDepth, setSearchDepth] = useState<number>(3);
  const [weights, setWeights] = useState<HeuristicWeights>(DEFAULT_HEURISTIC_WEIGHTS);
  const [isAutoMonster, setIsAutoMonster] = useState<boolean>(true);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Search Results & Stepper state
  const [lastSearchResult, setLastSearchResult] = useState<SearchResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Initialize Game State from Level
  const initGameState = useCallback((lvl: LevelConfig): GameState => {
    const grid: CellType[][] = Array.from({ length: lvl.height }, () =>
      Array.from({ length: lvl.width }, () => 'empty')
    );

    for (const w of lvl.walls) {
      if (w.y < lvl.height && w.x < lvl.width) grid[w.y][w.x] = 'wall';
    }
    for (const t of lvl.traps) {
      if (t.y < lvl.height && t.x < lvl.width) grid[t.y][t.x] = 'trap';
    }
    if (lvl.keyPos) {
      grid[lvl.keyPos.y][lvl.keyPos.x] = 'key';
    }
    grid[lvl.exitPos.y][lvl.exitPos.x] = 'exit';

    return {
      levelId: lvl.id,
      width: lvl.width,
      height: lvl.height,
      grid,
      hero: { ...lvl.heroStart },
      monster: { ...lvl.monsterStart },
      keyPos: { ...lvl.keyPos },
      exitPos: { ...lvl.exitPos },
      hasKey: false,
      turn: 'hero',
      turnCount: 1,
      isGameOver: false,
      winner: null,
      gameOverReason: null,
      lastMonsterMove: null,
    };
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => initGameState(DUNGEON_LEVELS[0]));

  // Auto-run initial search so tree explorer and debugger have state immediately
  useEffect(() => {
    if (!lastSearchResult) {
      const initialSimple = {
        hero: gameState.hero,
        monster: gameState.monster,
        hasKey: gameState.hasKey,
        heroAlive: true,
      };
      const res = runAlphaBetaSearch(initialSimple, {
        depth: searchDepth,
        weights,
        width: gameState.width,
        height: gameState.height,
        walls: currentLevel.walls,
        traps: currentLevel.traps,
        keyPos: currentLevel.keyPos,
        exitPos: currentLevel.exitPos,
        moveOrdering: 'heuristic',
      });
      setLastSearchResult(res);
    }
  }, [currentLevel, gameState, lastSearchResult, searchDepth, weights]);

  // Restart handler
  const handleRestart = useCallback(() => {
    const fresh = initGameState(currentLevel);
    setGameState(fresh);
    setCurrentStepIndex(0);

    const initialSimple = {
      hero: fresh.hero,
      monster: fresh.monster,
      hasKey: fresh.hasKey,
      heroAlive: true,
    };
    const res = runAlphaBetaSearch(initialSimple, {
      depth: searchDepth,
      weights,
      width: fresh.width,
      height: fresh.height,
      walls: currentLevel.walls,
      traps: currentLevel.traps,
      keyPos: currentLevel.keyPos,
      exitPos: currentLevel.exitPos,
      moveOrdering: 'heuristic',
    });
    setLastSearchResult(res);
  }, [currentLevel, initGameState, searchDepth, weights]);

  // Level selection handler
  const handleSelectLevel = useCallback((lvl: LevelConfig) => {
    setCurrentLevel(lvl);
    const fresh = initGameState(lvl);
    setGameState(fresh);
    setCurrentStepIndex(0);

    const initialSimple = {
      hero: fresh.hero,
      monster: fresh.monster,
      hasKey: fresh.hasKey,
      heroAlive: true,
    };
    const res = runAlphaBetaSearch(initialSimple, {
      depth: searchDepth,
      weights,
      width: fresh.width,
      height: fresh.height,
      walls: lvl.walls,
      traps: lvl.traps,
      keyPos: lvl.keyPos,
      exitPos: lvl.exitPos,
      moveOrdering: 'heuristic',
    });
    setLastSearchResult(res);
  }, [initGameState, searchDepth, weights]);

  // Execute Monster's turn using real Minimax with Alpha-Beta
  const executeMonsterTurn = useCallback((currentState: GameState) => {
    if (currentState.isGameOver || currentState.turn !== 'monster') return;

    setIsAiThinking(true);

    const searchOptions = {
      depth: searchDepth,
      weights,
      width: currentState.width,
      height: currentState.height,
      walls: currentLevel.walls,
      traps: currentLevel.traps,
      keyPos: currentLevel.keyPos,
      exitPos: currentLevel.exitPos,
      moveOrdering: 'heuristic' as const,
    };

    const simpleState = {
      hero: currentState.hero,
      monster: currentState.monster,
      hasKey: currentState.hasKey,
      heroAlive: true,
    };

    const result = runAlphaBetaSearch(simpleState, searchOptions);
    setLastSearchResult(result);
    setCurrentStepIndex(0);

    // Apply Monster's chosen move after brief visual delay
    const applyMoveDelay = isAutoMonster ? 260 : 0;
    setTimeout(() => {
      const bestMove = result.bestMove;
      const nextSimpleState = applyMove(
        simpleState,
        bestMove,
        true,
        currentLevel.keyPos,
        currentLevel.traps
      );

      soundManager.playMonsterMove();

      // Check if monster caught hero
      const caughtHero = isSamePos(nextSimpleState.monster, currentState.hero);

      setGameState((prev) => {
        if (caughtHero) {
          soundManager.playDefeat();
          return {
            ...prev,
            monster: nextSimpleState.monster,
            lastMonsterMove: bestMove,
            isGameOver: true,
            winner: 'monster',
            gameOverReason: 'The Monster intercepted and caught the Hero!',
          };
        }

        return {
          ...prev,
          monster: nextSimpleState.monster,
          lastMonsterMove: bestMove,
          turn: 'hero',
          turnCount: prev.turnCount + 1,
        };
      });

      setIsAiThinking(false);
    }, applyMoveDelay);
  }, [currentLevel, isAutoMonster, searchDepth, weights]);

  // Trigger Monster turn if auto-step is active and it's monster's turn
  useEffect(() => {
    if (gameState.turn === 'monster' && !gameState.isGameOver && isAutoMonster) {
      executeMonsterTurn(gameState);
    }
  }, [gameState, isAutoMonster, executeMonsterTurn]);

  // Hero move handler
  const handleHeroMove = useCallback((dir: Direction) => {
    if (gameState.isGameOver || gameState.turn !== 'hero') return;

    const { hero, width, height, grid, exitPos, keyPos, hasKey, monster } = gameState;

    let targetPos = { ...hero };
    if (dir !== 'WAIT') {
      const delta = DIRECTIONS[dir];
      targetPos = { x: hero.x + delta.x, y: hero.y + delta.y };
    }

    // Check bounds
    if (targetPos.x < 0 || targetPos.x >= width || targetPos.y < 0 || targetPos.y >= height) {
      return;
    }

    // Check wall
    if (grid[targetPos.y][targetPos.x] === 'wall') {
      return;
    }

    // Check locked exit
    if (isSamePos(targetPos, exitPos) && !hasKey) {
      return;
    }

    soundManager.playHeroStep();

    // Check key pickup
    let nowHasKey = hasKey;
    if (keyPos && isSamePos(targetPos, keyPos) && !hasKey) {
      nowHasKey = true;
      soundManager.playKeyPickup();
    }

    // Check trap
    const isTrap = grid[targetPos.y][targetPos.x] === 'trap';
    if (isTrap) {
      soundManager.playTrap();
      soundManager.playDefeat();
      setGameState((prev) => ({
        ...prev,
        hero: targetPos,
        hasKey: nowHasKey,
        isGameOver: true,
        winner: 'monster',
        gameOverReason: 'Hero stepped onto a lethal spike trap!',
      }));
      return;
    }

    // Check if hero walked directly into monster
    if (isSamePos(targetPos, monster)) {
      soundManager.playDefeat();
      setGameState((prev) => ({
        ...prev,
        hero: targetPos,
        hasKey: nowHasKey,
        isGameOver: true,
        winner: 'monster',
        gameOverReason: 'Hero walked directly into the Monster!',
      }));
      return;
    }

    // Check if hero escaped
    if (nowHasKey && isSamePos(targetPos, exitPos)) {
      soundManager.playVictory();
      setGameState((prev) => ({
        ...prev,
        hero: targetPos,
        hasKey: nowHasKey,
        isGameOver: true,
        winner: 'hero',
        gameOverReason: 'Hero unlocked the exit portal and escaped the dungeon!',
      }));
      return;
    }

    // Advance to Monster's turn
    const nextState: GameState = {
      ...gameState,
      hero: targetPos,
      hasKey: nowHasKey,
      turn: 'monster',
    };

    setGameState(nextState);
  }, [gameState]);

  // Keyboard navigation listener (active in game arena)
  useEffect(() => {
    if (activeSection !== 'arena') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState.turn !== 'hero' || gameState.isGameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleHeroMove('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleHeroMove('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleHeroMove('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleHeroMove('RIGHT');
          break;
        case ' ':
        case 'Enter':
          handleHeroMove('WAIT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, gameState.isGameOver, gameState.turn, handleHeroMove]);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const currentSimpleState = {
    hero: gameState.hero,
    monster: gameState.monster,
    hasKey: gameState.hasKey,
    heroAlive: !gameState.isGameOver || gameState.winner === 'hero',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Navigation */}
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        turnCount={gameState.turnCount}
        currentLevelName={currentLevel.name}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6">
        {activeSection === 'arena' && (
          <GameArena
            gameState={gameState}
            currentLevel={currentLevel}
            searchDepth={searchDepth}
            isAutoMonster={isAutoMonster}
            isAiThinking={isAiThinking}
            onHeroMove={handleHeroMove}
            onRestart={handleRestart}
            onSelectLevel={handleSelectLevel}
            onChangeDepth={setSearchDepth}
            onToggleAutoMonster={() => setIsAutoMonster(!isAutoMonster)}
            onStepMonsterManual={() => executeMonsterTurn(gameState)}
            onNavigate={setActiveSection}
          />
        )}

        {activeSection === 'lab' && (
          <AiLab onNavigate={setActiveSection} />
        )}

        {activeSection === 'tree' && (
          <SearchTreeExplorer
            currentSearchResult={lastSearchResult}
            currentState={currentSimpleState}
            currentLevel={currentLevel}
            weights={weights}
            searchDepth={searchDepth}
            onUpdateSearchResult={setLastSearchResult}
            activeTraceNodeId={lastSearchResult?.trace[currentStepIndex]?.nodeId}
          />
        )}

        {activeSection === 'debugger' && (
          <StepDebugger
            currentSearchResult={lastSearchResult}
            currentState={currentSimpleState}
            currentLevel={currentLevel}
            weights={weights}
            searchDepth={searchDepth}
            currentStepIndex={currentStepIndex}
            onStepChange={setCurrentStepIndex}
            onUpdateSearchResult={setLastSearchResult}
          />
        )}

        {activeSection === 'heuristics' && (
          <HeuristicInspectorPage
            weights={weights}
            onUpdateWeights={setWeights}
            currentState={currentSimpleState}
            currentLevel={currentLevel}
          />
        )}

        {activeSection === 'performance' && (
          <AiPerformancePage
            currentState={currentSimpleState}
            currentLevel={currentLevel}
            weights={weights}
            searchDepth={searchDepth}
          />
        )}
      </main>
    </div>
  );
}
