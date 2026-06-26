import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Activity, ArrowRight, Layers } from 'lucide-react';

interface Event {
  id: string;
  model_name: string;
  provider_name: string;
  event_type: 'launch' | 'update' | 'deprecation' | 'restriction' | 'pricing_change';
  summary: string;
  published_date: string;
  impact_score: 'major' | 'minor';
}

interface LandingProps {
  onNavigate: (hash: string) => void;
}

// Fallback seed data in case backend is loading/unreachable
const FALLBACK_TICKER_EVENTS: Event[] = [
  {
    id: 'evt-001',
    model_name: 'GPT-4o',
    provider_name: 'OpenAI',
    event_type: 'launch',
    summary: 'OpenAI launches its new flagship model, GPT-4o, integrating text, vision, and audio natively, twice as fast and 50% cheaper.',
    published_date: '2024-05-13',
    impact_score: 'major'
  },
  {
    id: 'evt-006',
    model_name: 'Claude 3.5 Sonnet',
    provider_name: 'Anthropic',
    event_type: 'launch',
    summary: 'Anthropic releases Claude 3.5 Sonnet, setting new industry benchmarks for reasoning, knowledge, and coding, running at 2x speed.',
    published_date: '2024-06-20',
    impact_score: 'major'
  },
  {
    id: 'evt-010',
    model_name: 'Llama 3.1 405B',
    provider_name: 'Meta',
    event_type: 'launch',
    summary: 'Meta releases Llama 3.1 405B, the largest open-weights LLM in the industry, offering state-of-the-art synthetic data generation.',
    published_date: '2024-07-23',
    impact_score: 'major'
  }
];

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const [tickerEvents, setTickerEvents] = useState<Event[]>(FALLBACK_TICKER_EVENTS);

  useEffect(() => {
    fetch('http://localhost:3001/api/events')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data: Event[]) => {
        // Sort by date descending and take top 3
        const sorted = [...data].sort(
          (a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        );
        if (sorted.length > 0) {
          setTickerEvents(sorted.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Using local landing ticker fallback due to unreachable server:', err);
      });
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'launch':
        return 'text-event-launch';
      case 'update':
        return 'text-event-update';
      case 'deprecation':
        return 'text-event-deprecation';
      case 'restriction':
        return 'text-event-restriction';
      case 'pricing_change':
        return 'text-event-pricing';
      default:
        return 'text-gray-400';
    }
  };

  const getEventTypeLabel = (type: string) => {
    return type.toUpperCase().replace('_', ' ');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between">
      {/* Ticker Strip */}
      <div className="border-y border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/50 dark:bg-dark-card/50 light:bg-slate-100 py-3 overflow-hidden">
        <div className="ticker-wrap relative">
          <div className="ticker-content flex space-x-12 select-none">
            {/* Repeated twice to make the ticker scrolling continuous and seamless */}
            {[...tickerEvents, ...tickerEvents].map((evt, idx) => (
              <div key={`${evt.id}-${idx}`} className="flex items-center space-x-3 text-sm shrink-0">
                <span className="font-bold uppercase tracking-wider dark:text-dark-text light:text-light-text">
                  {evt.provider_name}
                </span>
                <span className="text-dark-muted font-mono">{evt.model_name}</span>
                <span className={`font-semibold text-xs ${getEventTypeColor(evt.event_type)}`}>
                  [{getEventTypeLabel(evt.event_type)}]
                </span>
                <span className="dark:text-slate-400 light:text-slate-600 max-w-lg truncate">
                  {evt.summary}
                </span>
                <span className="text-xs text-dark-muted font-mono">{evt.published_date}</span>
                <span className="dark:text-dark-border light:text-light-border">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-400 tracking-wider uppercase mb-2 animate-pulse">
            <Activity className="h-3 w-3" />
            <span>Real-time Frontier Model Monitoring</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-400 light:from-slate-800 light:via-slate-900 light:to-slate-600 bg-clip-text text-transparent leading-tight">
            Bloomberg-Style Intelligence <br />
            for the AI Lifecycle
          </h1>

          <p className="text-lg text-dark-muted light:text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ModelPulse ingests, classifies, and summarizes real-world updates about frontier AI models. 
            Monitor launches, version upgrades, deprecations, access suspensions, and pricing changes 
            across major providers in a single analyst-grade dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('#/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-150 shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('#/methodology')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-dark-border dark:border-dark-border light:border-light-border hover:bg-dark-card/50 dark:hover:bg-dark-card/50 light:hover:bg-slate-100 dark:text-dark-text light:text-light-text font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              <span>Read Methodology</span>
            </button>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/30 dark:bg-dark-card/30 light:bg-white text-left space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg dark:text-dark-text light:text-light-text">Relational Tracking</h3>
              <p className="text-sm text-dark-muted light:text-slate-600">
                Track full version lineages, deprecations, and active capabilities mapped back to specific developers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/30 dark:bg-dark-card/30 light:bg-white text-left space-y-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg dark:text-dark-text light:text-light-text">NLP Classification</h3>
              <p className="text-sm text-dark-muted light:text-slate-600">
                Automated ingestion of raw technical articles categorized into five distinct operational event types.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/30 dark:bg-dark-card/30 light:bg-white text-left space-y-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg w-fit">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg dark:text-dark-text light:text-light-text">Human-in-the-Loop</h3>
              <p className="text-sm text-dark-muted light:text-slate-600">
                An active supervisor interface allows administrative corrections of classifications before public release.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-dark-border dark:border-dark-border light:border-light-border py-6 text-center text-xs text-dark-muted">
        <span>ModelPulse © 2026 — Capstone Research Project. Powered by Node.js & React.</span>
      </div>
    </div>
  );
};
