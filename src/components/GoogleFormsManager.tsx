import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ClipboardCopy,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CreatedGoogleFormInfo, GoogleFormsResponseItem } from '../types';
import {
  createGoogleForm,
  getSavedForms,
  deleteSavedForm,
  fetchFormResponses,
} from '../services/googleForms';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmationModal } from './ConfirmationModal';

interface GoogleFormsManagerProps {
  user: User | null;
  onSignIn: () => void;
  isLoggingIn: boolean;
  onFormSelect?: (form: CreatedGoogleFormInfo) => void;
}

export const GoogleFormsManager: React.FC<GoogleFormsManagerProps> = ({
  user,
  onSignIn,
  isLoggingIn,
  onFormSelect,
}) => {
  const [forms, setForms] = useState<CreatedGoogleFormInfo[]>([]);
  const [selectedForm, setSelectedForm] = useState<CreatedGoogleFormInfo | null>(null);
  const [formResponses, setFormResponses] = useState<GoogleFormsResponseItem[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Confirmation modal states (MANDATORY per workspace integration guidelines)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details: string[];
    actionType: 'create_unified' | 'create_reg' | 'create_feedback' | 'delete';
    targetFormId?: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: [],
    actionType: 'create_unified',
    isLoading: false,
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load saved forms
  useEffect(() => {
    const loaded = getSavedForms();
    setForms(loaded);
    if (loaded.length > 0 && !selectedForm) {
      setSelectedForm(loaded[0]);
    }
  }, []);

  // Fetch responses when selected form changes and user is signed in
  useEffect(() => {
    if (selectedForm && user) {
      loadResponses(selectedForm.formId);
    }
  }, [selectedForm, user]);

  const loadResponses = async (formId: string) => {
    setIsLoadingResponses(true);
    try {
      const data = await fetchFormResponses(formId);
      setFormResponses(data);
    } catch (err: any) {
      console.warn('Could not load Google Forms responses:', err);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const showCreateConfirm = (mode: 'unified' | 'registration' | 'feedback') => {
    if (!user) {
      onSignIn();
      return;
    }

    let title = 'Create Official Google Form?';
    let message = 'This will create a new live Google Form in your personal Google account with all defined questions and sections.';
    let details = [
      'Sets up form title, header description, and disclaimer',
      'Configures all 24 questions, multiple choice, scales, and checkboxes',
      'Adds page break sections and Tester Agreement terms',
      'Generates live editable URL and public responder link',
    ];

    if (mode === 'registration') {
      title = 'Create Beta Registration Form (Sections 1–5)?';
      message = 'Creates the tester onboarding form focusing on identity, Google Play email, device, and gaming background.';
      details = [
        'Sections 1 to 5 + Tester Agreement (Questions 1–14 & 24)',
        'Ideal for recruiting testers before sending apk builds',
      ];
    } else if (mode === 'feedback') {
      title = 'Create Post-Test Feedback Form (Section 6)?';
      message = 'Creates a dedicated post-play evaluation form for testers after they install and test the Snake Game build.';
      details = [
        'Ratings for Gameplay, Controls, Graphics, Performance',
        'Detailed Bug reporting, likes, and suggestions (Questions 15–23)',
      ];
    }

    setConfirmModalState({
      isOpen: true,
      title,
      message,
      details,
      actionType: mode === 'unified' ? 'create_unified' : mode === 'registration' ? 'create_reg' : 'create_feedback',
      isLoading: false,
    });
  };

  const showDeleteConfirm = (form: CreatedGoogleFormInfo) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Remove Form from Local Hub?',
      message: `Are you sure you want to remove "${form.title}" from this dashboard?`,
      details: [
        `Form ID: ${form.formId}`,
        'The form will remain accessible in your Google Drive / Google Forms.',
      ],
      actionType: 'delete',
      targetFormId: form.formId,
      isLoading: false,
    });
  };

  const handleExecuteConfirmedAction = async () => {
    const { actionType, targetFormId } = confirmModalState;
    setConfirmModalState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (actionType === 'delete' && targetFormId) {
        deleteSavedForm(targetFormId);
        const updated = forms.filter((f) => f.formId !== targetFormId);
        setForms(updated);
        if (selectedForm?.formId === targetFormId) {
          setSelectedForm(updated[0] || null);
        }
        setNotification({ type: 'success', text: 'Form removed from dashboard.' });
      } else {
        const mode =
          actionType === 'create_reg'
            ? 'registration'
            : actionType === 'create_feedback'
            ? 'feedback'
            : 'unified';
        const newForm = await createGoogleForm(mode);
        const updatedForms = getSavedForms();
        setForms(updatedForms);
        setSelectedForm(newForm);
        if (onFormSelect) onFormSelect(newForm);
        setNotification({
          type: 'success',
          text: `Successfully created "${newForm.title}" in your Google account!`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Operation failed. Please check permissions.',
      });
    } finally {
      setConfirmModalState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Get all tester emails collected (combining local submissions and Google Form if any)
  const getGooglePlayEmails = (): string[] => {
    const emailList = new Set<string>();

    // From local submissions
    try {
      const local = JSON.parse(localStorage.getItem('snake_beta_local_submissions') || '[]');
      local.forEach((item: any) => {
        if (item.googlePlayEmail && item.googlePlayEmail.includes('@')) {
          emailList.add(item.googlePlayEmail.trim());
        }
      });
    } catch (e) {
      // ignore
    }

    // From Google Form answers
    formResponses.forEach((res) => {
      Object.values(res.answers || {}).forEach((ans) => {
        ans.textAnswers?.answers?.forEach((a) => {
          if (a.value && a.value.includes('@') && a.value.includes('.')) {
            emailList.add(a.value.trim());
          }
        });
      });
    });

    return Array.from(emailList);
  };

  const copyGooglePlayEmails = () => {
    const emails = getGooglePlayEmails();
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join(', '));
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Auth Banner & Connection Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Google Forms Integration</h2>
              {user ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Authentication Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {user
                ? `Signed in as ${user.email}. Create and sync official forms in your Google Drive.`
                : 'Sign in with your Google account to create, manage, and read responses from Google Forms.'}
            </p>
          </div>
        </div>

        {!user && (
          <div className="shrink-0 w-full md:w-auto">
            <GoogleSignInButton
              onClick={onSignIn}
              isLoading={isLoggingIn}
              text="Connect Google Forms"
            />
          </div>
        )}
      </div>

      {/* Form Creation Generator Options */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              Generate Official Forms in Google Account
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates forms with all questions, section headers, scales, and agreements automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Unified All-in-One Form */}
          <div className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 rounded uppercase">
                  Recommended
                </span>
                <span className="text-xs text-slate-500">24 Questions</span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Unified Complete Form
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Includes all 6 Sections: About You, Google Play Testing, Android Device, Gaming Experience, Beta Testing, and Post-Test Feedback + Agreement.
              </p>
            </div>
            <button
              onClick={() => showCreateConfirm('unified')}
              className="mt-5 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus size={15} /> Create Unified Form
            </button>
          </div>

          {/* Card 2: Registration Only Form */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 rounded uppercase">
                  Recruitment
                </span>
                <span className="text-xs text-slate-500">14 Questions</span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                Registration Only
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sections 1–5 + Tester Agreement. Ideal for onboarding testers and building your Google Play testing roster.
              </p>
            </div>
            <button
              onClick={() => showCreateConfirm('registration')}
              className="mt-5 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-blue-500/30 transition-all cursor-pointer"
            >
              <Plus size={15} /> Create Registration Form
            </button>
          </div>

          {/* Card 3: Post-Play Feedback Only */}
          <div className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 rounded uppercase">
                  Gameplay Evaluation
                </span>
                <span className="text-xs text-slate-500">9 Questions</span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                Post-Test Feedback
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Section 6: Gameplay, Controls, Graphics, Performance ratings (1-5 scales) and bug reporting. Send to testers after they play.
              </p>
            </div>
            <button
              onClick={() => showCreateConfirm('feedback')}
              className="mt-5 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-purple-500/30 transition-all cursor-pointer"
            >
              <Plus size={15} /> Create Feedback Form
            </button>
          </div>
        </div>
      </div>

      {/* Created Forms Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" />
            Active Google Forms ({forms.length})
          </h3>
        </div>

        {forms.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
            <FileText size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Google Forms created yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Click any of the create buttons above to deploy the official Snake Game form directly into your Google account.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((f) => (
              <div
                key={f.formId}
                className={`p-4 rounded-xl border transition-all ${
                  selectedForm?.formId === f.formId
                    ? 'bg-slate-950 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{f.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {f.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      ID: {f.formId} • Created: {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedForm(f);
                        if (onFormSelect) onFormSelect(f);
                        if (user) loadResponses(f.formId);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={12} className={isLoadingResponses ? 'animate-spin' : ''} />
                      Sync Responses
                    </button>

                    <a
                      href={f.editUri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors border border-emerald-500/20"
                    >
                      Edit in Forms <ExternalLink size={12} />
                    </a>

                    <a
                      href={f.responderUri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Public Link <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => copyToClipboard(f.responderUri, f.formId)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedLink === f.formId ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    <button
                      onClick={() => showDeleteConfirm(f)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove from Dashboard"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Play Console Tester Exporter & Response Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone size={18} className="text-emerald-400" />
              Google Play Console Beta Roster Exporter
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy verified Google Play emails directly to paste into your Closed / Internal test track.
            </p>
          </div>

          <button
            onClick={copyGooglePlayEmails}
            disabled={getGooglePlayEmails().length === 0}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            {copiedEmails ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copiedEmails ? 'Copied to Clipboard!' : 'Copy Play Console Roster'}
          </button>
        </div>

        {/* Tester Emails Preview Box */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">
              Collected Tester Emails ({getGooglePlayEmails().length}):
            </span>
          </div>
          {getGooglePlayEmails().length > 0 ? (
            <div className="text-emerald-400 leading-relaxed max-h-32 overflow-y-auto">
              {getGooglePlayEmails().join(', ')}
            </div>
          ) : (
            <p className="text-slate-600 italic">
              No tester emails collected yet. Register through the Registration Form tab or sync Google Forms.
            </p>
          )}
        </div>
      </div>

      {/* Mandatory User Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        details={confirmModalState.details}
        confirmLabel={confirmModalState.actionType === 'delete' ? 'Remove' : 'Create Google Form'}
        isDestructive={confirmModalState.actionType === 'delete'}
        isLoading={confirmModalState.isLoading}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
