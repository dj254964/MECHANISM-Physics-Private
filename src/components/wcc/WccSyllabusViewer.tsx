import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Check,
  RefreshCw,
  Layers,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  Target,
  Info
} from 'lucide-react';

interface CorePaper {
  code: string;
  codeStatus?: string;
  name: string;
  units: string[];
  recommendedTextbooks: string[];
}

interface SemesterSyllabus {
  semester: string;
  title: string;
  description: string;
  verificationStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  academicYear: string;
  corePapers: CorePaper[];
  practicals: string[];
  learningOutcomes: string[];
  alliedCourses: string[];
}

interface CurriculumMetadata {
  institution: string;
  department: string;
  affiliation: string;
  autonomousStatus: string;
  officialUrl: string;
  verificationStatus: string;
  sourceTitle: string;
  academicYear: string;
  verifiedInstitutionalFacts: string[];
  unverifiedIndicativeClaims: string[];
  auditNotes: string;
}

interface TextbookRef {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
}

export function WccSyllabusViewer() {
  const [metadata, setMetadata] = useState<CurriculumMetadata | null>(null);
  const [semesters, setSemesters] = useState<SemesterSyllabus[]>([]);
  const [textbooks, setTextbooks] = useState<TextbookRef[]>([]);
  const [userPrefs, setUserPrefs] = useState<{
    semester: string;
    major_minor: string;
    textbooks: string[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const [activeSemester, setActiveSemester] = useState<string>('Semester I');
  const [selectedTextbooks, setSelectedTextbooks] = useState<string[]>([]);
  const [majorMinor, setMajorMinor] = useState<string>('B.Sc. Physics Core');

  useEffect(() => {
    fetch('/api/wcc/curriculum')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setMetadata(json.data.metadata || null);
          setSemesters(json.data.semesters || []);
          setTextbooks(json.data.textbooks || []);
        }
      })
      .catch(console.error);

    fetch('/api/wcc/preferences')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setUserPrefs(json.data);
          setActiveSemester(json.data.semester || 'Semester I');
          setMajorMinor(json.data.major_minor || 'B.Sc. Physics Core');
          setSelectedTextbooks(json.data.textbooks || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/wcc/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: activeSemester,
          major_minor: majorMinor,
          textbooks: selectedTextbooks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUserPrefs(json.data);
        setMessage('Academic curriculum preferences updated successfully.');
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      setMessage(`Error updating preferences: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTextbook = (id: string) => {
    if (selectedTextbooks.includes(id)) {
      if (selectedTextbooks.length > 1) {
        setSelectedTextbooks(selectedTextbooks.filter(t => t !== id));
      }
    } else {
      setSelectedTextbooks([...selectedTextbooks, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        Loading WCC B.Sc. Physics Curriculum & Verification Status...
      </div>
    );
  }

  const currentSemObj = semesters.find(s => s.semester === activeSemester) || semesters[0];

  return (
    <div className="space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Top Banner with Institutional Credentials */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/40 border border-cyan-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner shrink-0 mt-1 sm:mt-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-100">
                Women's Christian College, Chennai
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                Autonomous (Est. 1915)
              </span>
            </div>
            <p className="text-xs text-cyan-400 font-medium mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Department of Physics • Affiliated to University of Madras</span>
              <a
                href={metadata?.officialUrl || 'https://wcc.edu.in'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors text-[11px]"
              >
                <span>wcc.edu.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-slate-400">Current Student Profile</div>
            <div className="text-xs font-semibold text-slate-200">
              {userPrefs?.semester || 'Semester I'} • {userPrefs?.textbooks.length || 3} Textbooks Selected
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Verification Status Box */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Curriculum Verification Status
            </span>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            {metadata?.verificationStatus || "Indicative curriculum — verify against WCC's current syllabus."}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Confirmed Information */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Confirmed Institutional Information</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              {(metadata?.verifiedInstitutionalFacts || [
                "Women's Christian College (WCC) is an autonomous institution in Chennai, established in 1915.",
                "Permanently affiliated to the University of Madras and autonomous since 1982.",
                "Department of Physics offers B.Sc. Physics (Shift I / Aided stream).",
                "Official web portal: https://wcc.edu.in"
              ]).map((fact, fIdx) => (
                <li key={fIdx} className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Indicative Mappings */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
              <Info className="w-4 h-4 shrink-0" />
              <span>Indicative Mappings (Verify with Department)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              {(metadata?.unverifiedIndicativeClaims || [
                "Course codes PH1201–PH6201 are indicative reference codes; internal WCC Board of Studies codes may differ.",
                "Units, elective allocations, and practical experiments are adapted from the University of Madras CBCS / TANSCHE framework.",
                "Students should verify specific internal course codes and practical manuals against current WCC department issuances."
              ]).map((claim, cIdx) => (
                <li key={cIdx} className="flex items-start space-x-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-2 border-t border-amber-500/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div>
            <span className="font-medium text-slate-300">Framework Source: </span>
            <span>{metadata?.sourceTitle || 'University of Madras B.Sc. Physics CBCS Model Syllabus & TANSCHE Guidelines'}</span>
          </div>
          <div>
            <span className="font-medium text-slate-300">Regulation Period: </span>
            <span className="text-slate-300">{metadata?.academicYear || 'Autonomous CBCS Framework'}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Semester Selector & Preferences Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSavePreferences} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Academic Settings</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Active Semester</label>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {semesters.map(s => (
                  <option key={s.semester} value={s.semester}>{s.semester}: {s.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Program Track</label>
              <select
                value={majorMinor}
                onChange={(e) => setMajorMinor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="B.Sc. Physics Core">B.Sc. Physics Core</option>
                <option value="B.Sc. Physics with Allied Mathematics">B.Sc. Physics with Allied Mathematics</option>
                <option value="B.Sc. Physics with Allied Chemistry">B.Sc. Physics with Allied Chemistry</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Preferred Standard Textbooks</label>
                <span className="text-[10px] text-cyan-400">{selectedTextbooks.length} selected</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {textbooks.map(tb => {
                  const isChecked = selectedTextbooks.includes(tb.id);
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => toggleTextbook(tb.id)}
                      className={`w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between text-xs ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{tb.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{tb.author}</div>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Updating...' : 'Save Academic Preferences'}</span>
            </button>
          </form>
        </div>

        {/* Right: Detailed Semester Syllabus, Papers, Practicals, and Outcomes */}
        <div className="lg:col-span-2 space-y-6">
          {currentSemObj && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">{currentSemObj.semester}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      Indicative Syllabus
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mt-1">{currentSemObj.title}</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300 self-start sm:self-center">
                  B.Sc. Physics (Autonomous)
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentSemObj.description}
              </p>

              {/* Core Papers Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Core Papers & Syllabus Units</span>
                </h4>
                {currentSemObj.corePapers.map((paper, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                          {paper.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{paper.name}</span>
                      </div>
                      <span className="text-[10px] text-amber-400/80 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
                        Indicative Code
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-slate-400">Syllabus Units:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {paper.units.map((unit, uIdx) => (
                          <div key={uIdx} className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60 flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                            <span>{unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Standard References: {paper.recommendedTextbooks.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practicals & Laboratory Work */}
              {currentSemObj.practicals && currentSemObj.practicals.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Indicative Practical Components & Laboratory Work</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentSemObj.practicals.map((prac, pIdx) => (
                      <div key={pIdx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                        <span>{prac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Outcomes */}
              {currentSemObj.learningOutcomes && currentSemObj.learningOutcomes.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Learning Outcomes</span>
                  </h4>
                  <div className="space-y-1.5">
                    {currentSemObj.learningOutcomes.map((outcome, oIdx) => (
                      <div key={oIdx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allied Courses */}
              {currentSemObj.alliedCourses && currentSemObj.alliedCourses.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Allied & Skill-Based Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSemObj.alliedCourses.map((c, cIdx) => (
                      <span key={cIdx} className="px-3 py-1.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Attribution Footer */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-300 font-medium">Source: </span>
                  <span>{currentSemObj.sourceTitle} ({currentSemObj.academicYear})</span>
                </div>
                <div className="flex items-center space-x-2 text-amber-400/90">
                  <span>Indicative curriculum — verify against WCC's current syllabus.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
