import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, BookOpen, Check, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface WccCurriculumSemester {
  semester: string;
  title: string;
  description: string;
}

interface StandardTextbook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
}

interface WccOnboardingModalProps {
  onCompleted: () => void;
}

export function WccOnboardingModal({ onCompleted }: WccOnboardingModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [semesters, setSemesters] = useState<WccCurriculumSemester[]>([]);
  const [textbooksList, setTextbooksList] = useState<StandardTextbook[]>([]);
  
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester I');
  const [majorMinor, setMajorMinor] = useState<string>('B.Sc. Physics Core');
  const [selectedTextbooks, setSelectedTextbooks] = useState<string[]>([
    'halliday_resnick',
    'beiser_modern',
    'griffiths_em'
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/wcc/curriculum')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setSemesters(json.data.semesters || []);
          setTextbooksList(json.data.textbooks || []);
        }
      })
      .catch(console.error);

    fetch('/api/wcc/preferences')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.semester) setSelectedSemester(json.data.semester);
          if (json.data.major_minor) setMajorMinor(json.data.major_minor);
          if (Array.isArray(json.data.textbooks)) setSelectedTextbooks(json.data.textbooks);
          
          if (!json.data.onboarding_completed) {
            setIsOpen(true);
          }
        }
      })
      .catch(() => {
        setIsOpen(true);
      });
  }, []);

  const handleToggleTextbook = (id: string) => {
    if (selectedTextbooks.includes(id)) {
      if (selectedTextbooks.length > 1) {
        setSelectedTextbooks(selectedTextbooks.filter(t => t !== id));
      }
    } else {
      setSelectedTextbooks([...selectedTextbooks, id]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wcc/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: selectedSemester,
          major_minor: majorMinor,
          textbooks: selectedTextbooks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsOpen(false);
        onCompleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0b0f19]/90 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-transparent flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-100">
                Women's Christian College, Chennai
              </h2>
              <p className="text-xs text-cyan-400 font-medium">
                B.Sc. Physics Adaptive Academic Engine & Textbook Integration
              </p>
            </div>
          </div>
          <div className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
            Step {step} of 3
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm text-slate-300">
                  <p className="font-medium text-slate-200">Welcome to MECHANISM Phy for WCC Chennai</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ground your learning in the indicative B.Sc. Physics curriculum structure for Women's Christian College (WCC), Chennai (Semesters I to VI) alongside your chosen standard reference textbooks. Explanations, derivations, and adaptive diagnostic tests will be grounded in these topics.
                  </p>
                  <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-amber-400/90 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>Indicative curriculum — verify against WCC's current syllabus.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Your Current Academic Semester
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSemester(sem)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedSemester === sem
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm">{sem}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {sem === 'Semester I' && 'Mechanics & Properties of Matter'}
                          {sem === 'Semester II' && 'Thermal Physics & Thermodynamics'}
                          {sem === 'Semester III' && 'Optics & Spectroscopy'}
                          {sem === 'Semester IV' && 'Electricity & Electromagnetism'}
                          {sem === 'Semester V' && 'Quantum Mechanics & Relativity'}
                          {sem === 'Semester VI' && 'Solid State Physics & Electronics'}
                        </div>
                      </div>
                      {selectedSemester === sem && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Degree Program Track
                </label>
                <select
                  value={majorMinor}
                  onChange={(e) => setMajorMinor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="B.Sc. Physics Core">B.Sc. Physics Core</option>
                  <option value="B.Sc. Physics with Allied Mathematics">B.Sc. Physics with Allied Mathematics</option>
                  <option value="B.Sc. Physics with Allied Chemistry">B.Sc. Physics with Allied Chemistry</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Select Your Preferred Reference Textbooks</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the authoritative physics textbooks you prefer for problem-solving and derivations. These will be cited in AI explanations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {textbooksList.map((tb) => {
                  const isSelected = selectedTextbooks.includes(tb.id);
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => handleToggleTextbook(tb.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 bg-slate-800'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{tb.title}</div>
                        <div className="text-[11px] text-indigo-300 font-medium">{tb.author}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{tb.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-100">Ready to Begin Learning</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your academic profile for <strong className="text-slate-200">WCC Chennai ({selectedSemester})</strong> with {selectedTextbooks.length} preferred textbooks is configured and saved persistently.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution:</span>
                  <span className="text-slate-200 font-medium">Women's Christian College (Autonomous), Chennai</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Semester:</span>
                  <span className="text-cyan-400 font-semibold">{selectedSemester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Track:</span>
                  <span className="text-slate-200 font-medium">{majorMinor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Textbooks:</span>
                  <span className="text-indigo-300 font-medium">{selectedTextbooks.length} selected</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px]">
                  <span className="text-slate-400">Curriculum Status:</span>
                  <span className="text-amber-400 font-medium">Indicative curriculum — verify against WCC's current syllabus.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-all"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Start Physics Studies'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
