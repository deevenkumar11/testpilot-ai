import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export function AiExplanationCard({ analysis }) {
  if (!analysis) return null;

  const { summary, confirmed_facts = [], possible_causes = [], suggested_fixes = [], provider } = analysis;

  const isLLM = provider && (provider.includes('gemini') || provider.includes('openai') || provider.includes('llm'));

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950 p-5 shadow-xl space-y-4">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-800/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              AI Error Diagnosis & Troubleshooting
            </h3>
            <span className="text-[11px] text-slate-400">
              Automated root cause analysis & recommendations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
            isLLM
              ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
              : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
          }`}>
            Engine: {provider || 'Rule-Based Engine'}
          </span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed font-medium">
        {summary}
      </div>

      {/* Two Column Grid: Confirmed Facts vs Probable Causes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confirmed Facts */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed Facts (Observed)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {confirmed_facts.length > 0 ? (
              confirmed_facts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold select-none">•</span>
                  <span>{fact}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No facts extracted</li>
            )}
          </ul>
        </div>

        {/* Probable Causes */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Possible Causes (Hypotheses)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {possible_causes.length > 0 ? (
              possible_causes.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold select-none">•</span>
                  <span>{cause}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No probable causes identified</li>
            )}
          </ul>
        </div>
      </div>

      {/* Actionable Suggested Fixes */}
      {suggested_fixes && suggested_fixes.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Actionable Debugging Steps</span>
          </div>
          <ol className="space-y-1.5 text-xs text-slate-200">
            {suggested_fixes.map((fix, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{fix}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
