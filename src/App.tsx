import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
} from './services/auth';
import { Navbar, AppTab } from './components/Navbar';
import { RegistrationForm } from './components/RegistrationForm';
import { SnakeGame } from './components/SnakeGame';
import { GoogleFormsManager } from './components/GoogleFormsManager';
import { TesterRoster } from './components/TesterRoster';
import { CreatedGoogleFormInfo } from './types';
import { getSavedForms } from './services/googleForms';
import {
  Gamepad2,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>('register');
  const [activeForm, setActiveForm] = useState<CreatedGoogleFormInfo | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [registrationInitialSection, setRegistrationInitialSection] = useState(0);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );

    // Load active form if any
    const savedForms = getSavedForms();
    if (savedForms.length > 0) {
      setActiveForm(savedForms[0]);
    }

    // Load submission count
    try {
      const stored = localStorage.getItem('snake_beta_local_submissions');
      if (stored) {
        setTotalSubmissions(JSON.parse(stored).length);
      }
    } catch (e) {
      // ignore
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const handleGoToFeedback = () => {
    setRegistrationInitialSection(5); // Section 6 is index 5
    setCurrentTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'register') setRegistrationInitialSection(0);
          setCurrentTab(tab);
        }}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        totalApplicantsCount={totalSubmissions}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Announcement Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Flame size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Upcoming Android Release: Snake Game Beta Testing Program
              </p>
              <p className="text-[11px] text-slate-400">
                Join our volunteer testing group to test mechanics, report device bugs, and shape the final release.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeForm ? (
              <a
                href={activeForm.responderUri}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Google Form Linked</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <button
                onClick={() => setCurrentTab('forms')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <span>Deploy to Google Forms</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Views */}
        {currentTab === 'register' && (
          <RegistrationForm
            linkedForm={activeForm}
            initialSectionIndex={registrationInitialSection}
            onSubmittedSuccess={() => {
              try {
                const stored = localStorage.getItem('snake_beta_local_submissions');
                if (stored) {
                  setTotalSubmissions(JSON.parse(stored).length);
                }
              } catch (e) {
                // ignore
              }
            }}
          />
        )}

        {currentTab === 'play' && (
          <SnakeGame onGoToFeedback={handleGoToFeedback} />
        )}

        {currentTab === 'forms' && (
          <GoogleFormsManager
            user={user}
            onSignIn={handleSignIn}
            isLoggingIn={isLoggingIn}
            onFormSelect={(form) => setActiveForm(form)}
          />
        )}

        {currentTab === 'roster' && (
          <TesterRoster
            linkedForm={activeForm}
            onGoToRegistration={() => {
              setRegistrationInitialSection(0);
              setCurrentTab('register');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-emerald-400" />
            <span className="font-bold text-slate-400">Snake Game Beta Testing Hub</span>
            <span>•</span>
            <span>Google Play Internal & Closed Testing Program</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck size={13} className="text-emerald-400" />
              Verified Google Forms API Integration
            </span>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('forms')}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <FileCheck2 size={13} /> Form Management
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
