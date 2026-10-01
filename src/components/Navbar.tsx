import React from 'react';
import { User } from 'firebase/auth';
import {
  Gamepad2,
  FileText,
  Users,
  Play,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

export type AppTab = 'register' | 'play' | 'forms' | 'roster';

interface NavbarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  totalApplicantsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onSignIn,
  onSignOut,
  isLoggingIn,
  totalApplicantsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div
            onClick={() => onTabChange('register')}
            className="flex items-center gap-3 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Gamepad2 size={22} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">
                  Snake Game
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded uppercase">
                  Beta
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Android Tester Registration & Forms
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onTabChange('register')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileText size={14} />
              Registration Form
            </button>

            <button
              onClick={() => onTabChange('play')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'play'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Play size={14} />
              Playable Build
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => onTabChange('forms')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'forms'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Sparkles size={14} />
              Google Forms
            </button>

            <button
              onClick={() => onTabChange('roster')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === 'roster'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Users size={14} />
              Tester Roster
              {totalApplicantsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded-full text-[10px] font-mono">
                  {totalApplicantsCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Auth Info or Sign In */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-emerald-500/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-semibold text-white leading-tight truncate max-w-[130px]">
                    {user.displayName || 'Developer'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={onSignIn}
                isLoading={isLoggingIn}
                text="Sign In"
              />
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-850 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => onTabChange('register')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentTab === 'register' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <FileText size={13} />
            Register
          </button>
          <button
            onClick={() => onTabChange('play')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentTab === 'play' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Play size={13} />
            Playtest
          </button>
          <button
            onClick={() => onTabChange('forms')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentTab === 'forms' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Sparkles size={13} />
            Forms
          </button>
          <button
            onClick={() => onTabChange('roster')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentTab === 'roster' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Users size={13} />
            Roster
          </button>
        </div>
      </div>
    </header>
  );
};
