import React, { useState } from 'react';
import { NavigationSection } from '../types/game';
import { Volume2, VolumeX, Menu, X, Swords, Compass } from 'lucide-react';

interface HeaderProps {
  activeSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  turnCount: number;
  currentLevelName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  isMuted,
  onToggleMute,
  turnCount,
  currentLevelName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationSection; label: string }[] = [
    { id: 'arena', label: 'Game Arena' },
    { id: 'lab', label: 'AI Lab' },
    { id: 'tree', label: 'Search Tree Explorer' },
    { id: 'debugger', label: 'Step Debugger' },
    { id: 'heuristics', label: 'Heuristic Inspector' },
    { id: 'performance', label: 'AI Performance' },
  ];

  const handleNavClick = (id: NavigationSection) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => handleNavClick('arena')}
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <span>Dungeon Escape: Monster Mind</span>
        </button>
      </div>

      {/* Zone 2: 6 clean single-line text navigation links */}
      <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 text-xs uppercase tracking-wider ${
                isActive
                  ? 'text-cyan-400 font-semibold underline underline-offset-8 decoration-cyan-400 decoration-2'
                  : 'hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-300 font-medium truncate max-w-[130px]">{currentLevelName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono text-cyan-400">Turn {turnCount}</span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
          title={isMuted ? 'Unmute game audio' : 'Mute game audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-slate-950/95 border-b border-slate-800 p-4 shadow-2xl backdrop-blur-md flex flex-col gap-2 z-50">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
