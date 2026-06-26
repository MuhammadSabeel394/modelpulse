import React from 'react';

export const Analytics: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold dark:text-dark-text light:text-light-text">Operational Analytics</h1>
      <p className="text-dark-muted light:text-slate-600">
        Interactive charts showing release frequencies, lifespans, and event type distributions.
      </p>
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-lg inline-block">
        Phase 3 Feature: Recharts-powered analytics page is currently being prepared.
      </div>
    </div>
  );
};
