import React from 'react';

export const Methodology: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold dark:text-dark-text light:text-light-text">Ingestion Pipeline Methodology</h1>
      <p className="text-dark-muted light:text-slate-600">
        Review documentation about model card evaluations, dataset accuracy, and LLM prompting configurations.
      </p>
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-lg inline-block">
        Phase 4 Feature: Capstone pipeline evaluation and model card metrics are currently being prepared.
      </div>
    </div>
  );
};
