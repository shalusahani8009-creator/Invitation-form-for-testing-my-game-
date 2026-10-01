import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { FormDataState, CreatedGoogleFormInfo } from '../types';
import { FORM_META, FORM_SECTIONS, AGREEMENT_ITEMS } from '../data/formSchema';

interface RegistrationFormProps {
  linkedForm?: CreatedGoogleFormInfo | null;
  onSubmittedSuccess?: (submission: FormDataState) => void;
  initialSectionIndex?: number;
}

const INITIAL_FORM_DATA: FormDataState = {
  name: '',
  ageGroup: '',
  country: '',
  googlePlayEmail: '',
  willingToInstallGooglePlay: 'Yes',
  phoneBrand: 'Samsung',
  phoneBrandOther: '',
  phoneModel: '',
  androidVersion: '',
  gamingFrequency: 'Several times a week',
  gameTypes: ['Arcade', 'Casual'],
  gameTypesOther: '',
  testingInterest: 5,
  testingAspects: ['Gameplay', 'Controls', 'Performance', 'Bugs / Errors'],
  testingDuration: '15–30 minutes',
  reportBugsWillingness: 'Yes',
  rateGameplay: 5,
  rateControls: 4,
  rateGraphics: 4,
  ratePerformance: 5,
  encounteredBugs: 'No',
  bugDescription: '',
  likedMost: '',
  improvements: '',
  otherSuggestions: '',
  agreementChecks: {
    isBeta: false,
    provideFeedback: false,
    unfinishedFeatures: false,
    voluntary: false,
  },
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  linkedForm,
  onSubmittedSuccess,
  initialSectionIndex = 0,
}) => {
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_DATA);
  const [activeStep, setActiveStep] = useState<number>(initialSectionIndex);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sections = FORM_SECTIONS;
  const isLastStep = activeStep === sections.length; // Step after section 6 is the Agreement step

  // Validation per section
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      // Section 1
      if (!formData.name.trim()) newErrors.name = 'Please tell us what to call you.';
      if (!formData.ageGroup) newErrors.ageGroup = 'Please select your age group.';
      if (!formData.country.trim()) newErrors.country = 'Please enter your country.';
    } else if (stepIndex === 1) {
      // Section 2
      if (!formData.googlePlayEmail.trim()) {
        newErrors.googlePlayEmail = 'Google Play email is required.';
      } else if (!formData.googlePlayEmail.includes('@') || !formData.googlePlayEmail.includes('.')) {
        newErrors.googlePlayEmail = 'Please enter a valid email address.';
      }
      if (!formData.willingToInstallGooglePlay) {
        newErrors.willingToInstallGooglePlay = 'Please select Yes or No.';
      }
    } else if (stepIndex === 2) {
      // Section 3
      if (!formData.phoneBrand) newErrors.phoneBrand = 'Please select your phone brand.';
      if (formData.phoneBrand === 'Other' && !formData.phoneBrandOther?.trim()) {
        newErrors.phoneBrandOther = 'Please specify your phone brand.';
      }
      if (!formData.phoneModel.trim()) newErrors.phoneModel = 'Phone model is required.';
    } else if (stepIndex === 3) {
      // Section 4
      if (!formData.gamingFrequency) newErrors.gamingFrequency = 'Please select gaming frequency.';
      if (formData.gameTypes.length === 0) newErrors.gameTypes = 'Please choose at least one game type.';
      if (formData.testingInterest < 1) newErrors.testingInterest = 'Please rate your interest.';
    } else if (stepIndex === 4) {
      // Section 5
      if (formData.testingAspects.length === 0)
        newErrors.testingAspects = 'Select at least one aspect to test.';
      if (!formData.testingDuration) newErrors.testingDuration = 'Please select test duration.';
      if (!formData.reportBugsWillingness)
        newErrors.reportBugsWillingness = 'Please specify if you are willing to report bugs.';
    } else if (stepIndex === 5) {
      // Section 6 is optional feedback, no hard requirements
    } else if (stepIndex === 6) {
      // Agreement Step
      const checks = formData.agreementChecks;
      if (!checks.isBeta || !checks.provideFeedback || !checks.unfinishedFeatures || !checks.voluntary) {
        newErrors.agreement = 'You must accept all 4 agreement statements to participate.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, sections.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch (e) {
      // confetti fallback
    }

    // Save submission locally
    const existingRaw = localStorage.getItem('snake_beta_local_submissions');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const submissionRecord = {
      ...formData,
      id: 'sub_' + Date.now(),
      submittedAt: new Date().toISOString(),
    };
    existing.unshift(submissionRecord);
    localStorage.setItem('snake_beta_local_submissions', JSON.stringify(existing));

    setIsSubmitted(true);
    if (onSubmittedSuccess) {
      onSubmittedSuccess(formData);
    }
  };

  const toggleGameType = (type: string) => {
    setFormData((prev) => {
      const exists = prev.gameTypes.includes(type);
      return {
        ...prev,
        gameTypes: exists ? prev.gameTypes.filter((t) => t !== type) : [...prev.gameTypes, type],
      };
    });
  };

  const toggleTestingAspect = (aspect: string) => {
    setFormData((prev) => {
      const exists = prev.testingAspects.includes(aspect);
      return {
        ...prev,
        testingAspects: exists
          ? prev.testingAspects.filter((a) => a !== aspect)
          : [...prev.testingAspects, aspect],
      };
    });
  };

  const toggleAgreementCheck = (key: keyof FormDataState['agreementChecks']) => {
    setFormData((prev) => ({
      ...prev,
      agreementChecks: {
        ...prev.agreementChecks,
        [key]: !prev.agreementChecks[key],
      },
    }));
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <Sparkles size={36} />
        </div>

        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full font-mono">
          Registration Complete
        </span>

        <h2 className="text-3xl font-extrabold text-white mt-3 mb-3">
          Thank you for joining our Snake Game Beta Testing program! 🐍🎮
        </h2>

        <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed mb-6">
          Your feedback will directly help us optimize controls, performance, and gameplay before our official Google Play release.
        </p>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl max-w-md mx-auto text-left mb-6">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
            <CheckCircle2 size={16} />
            <span>Google Play Testing Registration Recorded</span>
          </div>
          <p className="text-xs text-slate-400">
            Registered Email: <strong className="text-slate-200">{formData.googlePlayEmail}</strong>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Device: <strong className="text-slate-200">{formData.phoneBrand} ({formData.phoneModel})</strong>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            If selected, you will receive an invitation link to install the beta build directly via Google Play Internal Testing.
          </p>
        </div>

        {linkedForm && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl max-w-md mx-auto mb-6 flex items-center justify-between gap-3 text-left">
            <div>
              <p className="text-xs font-semibold text-emerald-300">
                Official Google Form is Live
              </p>
              <p className="text-[11px] text-slate-400">
                You can also submit responses directly to the creator's Google Form.
              </p>
            </div>
            <a
              href={linkedForm.responderUri}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
            >
              Open Form <ExternalLink size={12} />
            </a>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setFormData(INITIAL_FORM_DATA);
              setIsSubmitted(false);
              setActiveStep(0);
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} /> Register Another Tester
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl mx-auto shadow-2xl overflow-hidden">
      {/* Form Hero Header */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-b border-slate-800 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
            Android Volunteer Beta
          </span>
          {linkedForm && (
            <a
              href={linkedForm.responderUri}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              Google Forms Active <ExternalLink size={12} />
            </a>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          🎮 Snake Game — Beta Tester Registration
        </h1>
        <p className="text-slate-300 text-sm mt-3 leading-relaxed">
          We are looking for volunteer Android gamers to help us test our new Snake Game before its official release.
          As a beta tester, you will play the game, explore features, identify bugs, and share honest feedback to improve gameplay and controls.
        </p>

        {/* Step Indicator Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
              {activeStep < sections.length
                ? `${sections[activeStep].badge} — ${sections[activeStep].title}`
                : '✅ Tester Agreement'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Step {activeStep + 1} of {sections.length + 1}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex gap-1">
            {Array.from({ length: sections.length + 1 }).map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 transition-all duration-300 ${
                  idx < activeStep
                    ? 'bg-emerald-500'
                    : idx === activeStep
                    ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Section 1: About You */}
        {activeStep === 0 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">1. Short answer *</span>
              <label className="block text-base font-bold text-white mt-1">
                What should we call you?
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex or SnakeMaster"
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
              {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">2. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1">
                Age Group
              </label>
              <p className="text-xs text-slate-400 italic mb-3 flex items-center gap-1">
                <HelpCircle size={13} className="text-slate-500 shrink-0" />
                This is only to understand our tester audience. Do not collect an exact date of birth.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {['Under 16', '16–18', '19–24', '25–30', '31+'].map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setFormData({ ...formData, ageGroup: group })}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                      formData.ageGroup === group
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{group}</span>
                    {formData.ageGroup === group && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    )}
                  </button>
                ))}
              </div>
              {errors.ageGroup && <p className="text-xs text-red-400 mt-1.5">{errors.ageGroup}</p>}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">3. Short answer *</span>
              <label className="block text-base font-bold text-white mt-1">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. United States, Germany, India, United Kingdom..."
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
              {errors.country && <p className="text-xs text-red-400 mt-1.5">{errors.country}</p>}
            </div>
          </div>
        )}

        {/* Section 2: Google Play Testing */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">4. Short answer *</span>
              <label className="block text-base font-bold text-white mt-1">
                Google Account Email for Play Testing
              </label>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                Please enter the Google account email you use with Google Play. This email may be used to provide access to the beta test.
              </p>
              <input
                type="email"
                value={formData.googlePlayEmail}
                onChange={(e) => setFormData({ ...formData, googlePlayEmail: e.target.value })}
                placeholder="gamer.account@gmail.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
              {errors.googlePlayEmail && (
                <p className="text-xs text-red-400 mt-1.5">{errors.googlePlayEmail}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">5. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                Are you willing to install the beta version through Google Play?
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, willingToInstallGooglePlay: opt })}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-center ${
                      formData.willingToInstallGooglePlay === opt
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.willingToInstallGooglePlay && (
                <p className="text-xs text-red-400 mt-1.5">{errors.willingToInstallGooglePlay}</p>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Android Device */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">6. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                Android Phone Brand
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Samsung',
                  'Xiaomi / Redmi',
                  'OnePlus',
                  'Realme',
                  'Vivo',
                  'OPPO',
                  'Motorola',
                  'Google Pixel',
                  'Nothing',
                  'Other',
                ].map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setFormData({ ...formData, phoneBrand: brand })}
                    className={`px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-between ${
                      formData.phoneBrand === brand
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{brand}</span>
                    {formData.phoneBrand === brand && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>

              {formData.phoneBrand === 'Other' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specify Phone Brand:
                  </label>
                  <input
                    type="text"
                    value={formData.phoneBrandOther}
                    onChange={(e) => setFormData({ ...formData, phoneBrandOther: e.target.value })}
                    placeholder="e.g. Sony Xperia, Asus ROG, LG..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 text-sm focus:outline-none"
                  />
                  {errors.phoneBrandOther && (
                    <p className="text-xs text-red-400 mt-1">{errors.phoneBrandOther}</p>
                  )}
                </div>
              )}
              {errors.phoneBrand && <p className="text-xs text-red-400 mt-1.5">{errors.phoneBrand}</p>}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">7. Short answer *</span>
              <label className="block text-base font-bold text-white mt-1">
                Phone Model
              </label>
              <input
                type="text"
                value={formData.phoneModel}
                onChange={(e) => setFormData({ ...formData, phoneModel: e.target.value })}
                placeholder="e.g. Galaxy S24 Ultra, Pixel 8 Pro, Redmi Note 12..."
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
              {errors.phoneModel && <p className="text-xs text-red-400 mt-1.5">{errors.phoneModel}</p>}
            </div>

            <div>
              <span className="text-xs font-mono text-slate-400">8. Short answer (Optional)</span>
              <label className="block text-base font-bold text-white mt-1">
                Android Version
              </label>
              <input
                type="text"
                value={formData.androidVersion}
                onChange={(e) => setFormData({ ...formData, androidVersion: e.target.value })}
                placeholder="e.g. Android 14, Android 13 (Optional)"
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
        )}

        {/* Section 4: Gaming Experience */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">9. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                How often do you play mobile games?
              </label>
              <div className="space-y-2">
                {['Every day', 'Several times a week', 'Once a week', 'Occasionally', 'Rarely'].map(
                  (freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData({ ...formData, gamingFrequency: freq })}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                        formData.gamingFrequency === freq
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{freq}</span>
                      {formData.gamingFrequency === freq && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  )
                )}
              </div>
              {errors.gamingFrequency && (
                <p className="text-xs text-red-400 mt-1.5">{errors.gamingFrequency}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">10. Checkboxes *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                What types of mobile games do you usually play?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Arcade',
                  'Casual',
                  'Puzzle',
                  'Action',
                  'Racing',
                  'Strategy',
                  'Adventure',
                  'Multiplayer',
                  'Other',
                ].map((type) => {
                  const selected = formData.gameTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleGameType(type)}
                      className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2.5 ${
                        selected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-500 shrink-0" />
                      )}
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>
              {errors.gameTypes && <p className="text-xs text-red-400 mt-1.5">{errors.gameTypes}</p>}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">11. Linear scale 1–5 *</span>
              <label className="block text-base font-bold text-white mt-1 mb-2">
                How interested are you in testing new games?
              </label>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>1 = Not very interested</span>
                  <span>5 = Very interested</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, testingInterest: val })}
                      className={`py-3 rounded-xl border text-base font-bold transition-all text-center ${
                        formData.testingInterest === val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Beta Testing */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">12. Checkboxes *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                What would you be willing to test?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Gameplay',
                  'Controls',
                  'Graphics',
                  'Sound',
                  'Performance',
                  'Different game modes',
                  'Difficulty / Challenge',
                  'User Interface',
                  'Bugs / Errors',
                  'Overall experience',
                ].map((aspect) => {
                  const selected = formData.testingAspects.includes(aspect);
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => toggleTestingAspect(aspect)}
                      className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2.5 ${
                        selected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-500 shrink-0" />
                      )}
                      <span>{aspect}</span>
                    </button>
                  );
                })}
              </div>
              {errors.testingAspects && (
                <p className="text-xs text-red-400 mt-1.5">{errors.testingAspects}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">13. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                How long can you test the game?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {['10–15 minutes', '15–30 minutes', '30–60 minutes', 'More than 1 hour'].map(
                  (dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setFormData({ ...formData, testingDuration: dur })}
                      className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                        formData.testingDuration === dur
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{dur}</span>
                      {formData.testingDuration === dur && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold">14. Multiple choice *</span>
              <label className="block text-base font-bold text-white mt-1 mb-3">
                Are you willing to report bugs and give honest feedback?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Yes', 'Maybe', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, reportBugsWillingness: opt })}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-center ${
                      formData.reportBugsWillingness === opt
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Feedback After Testing */}
        {activeStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Post-Test Feedback (Optional or after playing the Demo)
              </span>
              <p className="text-xs text-slate-300">
                You can rate these questions now if you tested the in-app Snake build, or leave them for after you test the Google Play build.
              </p>
            </div>

            {/* Ratings 1-5 for Gameplay, Controls, Graphics, Performance */}
            {[
              {
                id: 'rateGameplay',
                title: '15. How would you rate the gameplay?',
                val: formData.rateGameplay,
                setter: (v: number) => setFormData({ ...formData, rateGameplay: v }),
              },
              {
                id: 'rateControls',
                title: '16. How would you rate the controls?',
                val: formData.rateControls,
                setter: (v: number) => setFormData({ ...formData, rateControls: v }),
              },
              {
                id: 'rateGraphics',
                title: '17. How would you rate the graphics and visual experience?',
                val: formData.rateGraphics,
                setter: (v: number) => setFormData({ ...formData, rateGraphics: v }),
              },
              {
                id: 'ratePerformance',
                title: "18. How would you rate the game's performance?",
                val: formData.ratePerformance,
                setter: (v: number) => setFormData({ ...formData, ratePerformance: v }),
              },
            ].map((rating) => (
              <div key={rating.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <label className="block text-sm font-bold text-white mb-2">{rating.title}</label>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>1 = Poor</span>
                  <span>5 = Excellent</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => rating.setter(num)}
                      className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                        rating.val === num
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Bug Encounter */}
            <div>
              <span className="text-xs font-mono text-slate-400">19. Multiple choice</span>
              <label className="block text-base font-bold text-white mt-1 mb-2">
                Did you encounter any bugs or problems?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Yes', 'No', 'Not sure'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, encounteredBugs: opt })}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all text-center ${
                      formData.encounteredBugs === opt
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Bug Description */}
            <div>
              <span className="text-xs font-mono text-slate-400">20. Paragraph</span>
              <label className="block text-base font-bold text-white mt-1">
                If you found a bug, please describe it.
              </label>
              <textarea
                rows={3}
                value={formData.bugDescription}
                onChange={(e) => setFormData({ ...formData, bugDescription: e.target.value })}
                placeholder="Describe what occurred, any error messages, or device hiccups..."
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>

            {/* What did you like most */}
            <div>
              <span className="text-xs font-mono text-slate-400">21. Paragraph</span>
              <label className="block text-base font-bold text-white mt-1">
                What did you like most about the game?
              </label>
              <textarea
                rows={2}
                value={formData.likedMost}
                onChange={(e) => setFormData({ ...formData, likedMost: e.target.value })}
                placeholder="What felt satisfying or fun?"
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>

            {/* What should we improve */}
            <div>
              <span className="text-xs font-mono text-slate-400">22. Paragraph</span>
              <label className="block text-base font-bold text-white mt-1">
                What should we improve?
              </label>
              <textarea
                rows={2}
                value={formData.improvements}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="Controls responsiveness, visuals, audio balance..."
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>

            {/* Other suggestions */}
            <div>
              <span className="text-xs font-mono text-slate-400">23. Paragraph</span>
              <label className="block text-base font-bold text-white mt-1">
                Do you have any other suggestions?
              </label>
              <textarea
                rows={2}
                value={formData.otherSuggestions}
                onChange={(e) => setFormData({ ...formData, otherSuggestions: e.target.value })}
                placeholder="Any creative game mode ideas, powerups, or feedback..."
                className="mt-2 w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 7: Agreement & Submission */}
        {activeStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={24} />
              <h3 className="text-xl font-bold text-white">24. Beta Testing Agreement *</h3>
            </div>
            <p className="text-sm text-slate-400">
              Please check all four boxes below to verify your voluntary participation in our Google Play beta program.
            </p>

            <div className="space-y-3">
              {AGREEMENT_ITEMS.map((item) => {
                const key = item.id as keyof FormDataState['agreementChecks'];
                const checked = formData.agreementChecks[key];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAgreementCheck(key)}
                    className={`w-full p-4 rounded-xl border text-sm transition-all text-left flex items-start gap-3 ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {checked ? (
                        <CheckSquare size={18} className="text-emerald-400" />
                      ) : (
                        <Square size={18} className="text-slate-500" />
                      )}
                    </div>
                    <span className="font-medium leading-relaxed">{item.text}</span>
                  </button>
                );
              })}
            </div>

            {errors.agreement && (
              <p className="text-xs text-red-400 font-semibold p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                {errors.agreement}
              </p>
            )}

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Summary of Your Application:
              </h4>
              <p className="text-xs text-slate-400">
                Name: <span className="text-white">{formData.name || 'Anonymous'}</span> | Age: <span className="text-white">{formData.ageGroup}</span> | Country: <span className="text-white">{formData.country}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Play Store Email: <span className="text-emerald-400 font-mono">{formData.googlePlayEmail}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Device: <span className="text-white">{formData.phoneBrand} ({formData.phoneModel})</span>
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-800">
          {activeStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Next Section <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Send size={16} /> Submit Beta Registration
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
