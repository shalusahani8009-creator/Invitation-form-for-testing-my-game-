import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  Bug,
  Smartphone,
  Star,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { FormDataState, CreatedGoogleFormInfo } from '../types';

interface TesterRosterProps {
  linkedForm?: CreatedGoogleFormInfo | null;
  onGoToRegistration: () => void;
}

export const TesterRoster: React.FC<TesterRosterProps> = ({
  linkedForm,
  onGoToRegistration,
}) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('snake_beta_local_submissions');
      if (raw) {
        setSubmissions(JSON.parse(raw));
      } else {
        // Pre-seed a couple of realistic demo applicants so the organizer immediately sees the roster in action
        const sampleApplicants = [
          {
            id: 'sample_1',
            name: 'Jordan K.',
            ageGroup: '19–24',
            country: 'Canada',
            googlePlayEmail: 'jordan.games@gmail.com',
            willingToInstallGooglePlay: 'Yes',
            phoneBrand: 'Samsung',
            phoneModel: 'Galaxy S23',
            androidVersion: 'Android 14',
            gamingFrequency: 'Every day',
            gameTypes: ['Arcade', 'Action', 'Multiplayer'],
            testingInterest: 5,
            testingAspects: ['Controls', 'Performance', 'Bugs / Errors'],
            testingDuration: '30–60 minutes',
            reportBugsWillingness: 'Yes',
            rateGameplay: 5,
            rateControls: 4,
            rateGraphics: 5,
            ratePerformance: 5,
            encounteredBugs: 'No',
            likedMost: 'Smooth turning physics and classic retro sound',
            submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            agreementChecks: { isBeta: true, provideFeedback: true, unfinishedFeatures: true, voluntary: true },
          },
          {
            id: 'sample_2',
            name: 'Elena Rostova',
            ageGroup: '25–30',
            country: 'Germany',
            googlePlayEmail: 'elena.androidtester@gmail.com',
            willingToInstallGooglePlay: 'Yes',
            phoneBrand: 'Xiaomi / Redmi',
            phoneModel: 'Redmi Note 12 Pro',
            androidVersion: 'Android 13',
            gamingFrequency: 'Several times a week',
            gameTypes: ['Arcade', 'Puzzle', 'Casual'],
            testingInterest: 5,
            testingAspects: ['Gameplay', 'User Interface', 'Bugs / Errors'],
            testingDuration: '15–30 minutes',
            reportBugsWillingness: 'Yes',
            rateGameplay: 4,
            rateControls: 4,
            rateGraphics: 4,
            ratePerformance: 4,
            encounteredBugs: 'Yes',
            bugDescription: 'Slight frame hiccup when eating bonus apples under power saver mode.',
            improvements: 'Add customizable D-pad button spacing for smaller screens.',
            submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            agreementChecks: { isBeta: true, provideFeedback: true, unfinishedFeatures: true, voluntary: true },
          },
          {
            id: 'sample_3',
            name: 'Marcus Chen',
            ageGroup: '16–18',
            country: 'Singapore',
            googlePlayEmail: 'marcus.chen.play@gmail.com',
            willingToInstallGooglePlay: 'Yes',
            phoneBrand: 'Google Pixel',
            phoneModel: 'Pixel 7',
            androidVersion: 'Android 14',
            gamingFrequency: 'Every day',
            gameTypes: ['Arcade', 'Racing', 'Multiplayer'],
            testingInterest: 4,
            testingAspects: ['Different game modes', 'Difficulty / Challenge', 'Overall experience'],
            testingDuration: 'More than 1 hour',
            reportBugsWillingness: 'Yes',
            rateGameplay: 5,
            rateControls: 5,
            rateGraphics: 5,
            ratePerformance: 5,
            encounteredBugs: 'No',
            likedMost: 'Speed Rush mode is intense and addicting!',
            submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            agreementChecks: { isBeta: true, provideFeedback: true, unfinishedFeatures: true, voluntary: true },
          },
        ];
        localStorage.setItem('snake_beta_local_submissions', JSON.stringify(sampleApplicants));
        setSubmissions(sampleApplicants);
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const filtered = submissions.filter((sub) => {
    const matchesSearch =
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.googlePlayEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phoneModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'ALL' || sub.phoneBrand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Name',
      'Email (Google Play)',
      'Age Group',
      'Country',
      'Phone Brand',
      'Phone Model',
      'Android Version',
      'Gaming Frequency',
      'Test Duration',
      'Will Report Bugs',
      'Rating Gameplay',
      'Rating Controls',
      'Bug Encountered',
      'Bug Description',
      'Submission Date',
    ];

    const rows = filtered.map((s) => [
      `"${s.name || ''}"`,
      `"${s.googlePlayEmail || ''}"`,
      `"${s.ageGroup || ''}"`,
      `"${s.country || ''}"`,
      `"${s.phoneBrand || ''}"`,
      `"${s.phoneModel || ''}"`,
      `"${s.androidVersion || ''}"`,
      `"${s.gamingFrequency || ''}"`,
      `"${s.testingDuration || ''}"`,
      `"${s.reportBugsWillingness || ''}"`,
      `"${s.rateGameplay || ''}"`,
      `"${s.rateControls || ''}"`,
      `"${s.encounteredBugs || ''}"`,
      `"${(s.bugDescription || '').replace(/"/g, '""')}"`,
      `"${s.submittedAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `snake_beta_testers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats
  const totalTesters = submissions.length;
  const readyPlayCount = submissions.filter((s) => s.willingToInstallGooglePlay === 'Yes').length;
  const bugReportsCount = submissions.filter((s) => s.encounteredBugs === 'Yes').length;
  const avgInterest =
    totalTesters > 0
      ? (
          submissions.reduce((acc, s) => acc + (s.testingInterest || 5), 0) / totalTesters
        ).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Testers</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalTesters}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Registered applicants</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Play Store Ready</span>
            <Smartphone size={16} className="text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {totalTesters > 0 ? `${Math.round((readyPlayCount / totalTesters) * 100)}%` : '100%'}
          </div>
          <span className="text-[11px] text-blue-400 mt-1 block">
            {readyPlayCount} willing to install via Play
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Interest</span>
            <Star size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{avgInterest} / 5</div>
          <span className="text-[11px] text-amber-400 mt-1 block">High testing motivation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bug Reports</span>
            <Bug size={16} className="text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{bugReportsCount}</div>
          <span className="text-[11px] text-red-400 mt-1 block">Reported in evaluations</span>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-emerald-400" />
              Beta Tester Roster ({filtered.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review volunteer details, device configurations, and gameplay evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={onGoToRegistration}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              + New Registration
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, Google Play email, device, or country..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Phone Brands</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi / Redmi">Xiaomi / Redmi</option>
              <option value="Google Pixel">Google Pixel</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Realme">Realme</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Tester Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Google Play Account</th>
                <th className="px-4 py-3">Device & OS</th>
                <th className="px-4 py-3">Gaming Frequency</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Bugs Found</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {filtered.map((tester) => (
                <tr key={tester.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    <div>{tester.name || 'Anonymous'}</div>
                    <div className="text-[11px] text-slate-500">
                      {tester.country} • {tester.ageGroup}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {tester.googlePlayEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{tester.phoneBrand}</div>
                    <div className="text-[11px] text-slate-500">
                      {tester.phoneModel} {tester.androidVersion && `(${tester.androidVersion})`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{tester.gamingFrequency}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={12} className="fill-amber-400" />
                      <span>{tester.testingInterest || 5}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tester.encounteredBugs === 'Yes' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        Bug Reported
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {tester.submittedAt
                      ? new Date(tester.submittedAt).toLocaleDateString()
                      : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No testers match your current search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
