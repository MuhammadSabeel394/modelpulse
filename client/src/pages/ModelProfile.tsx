import React, { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Shield, Cpu, AlertCircle, ArrowLeft, ArrowUpCircle, Rocket, Trash2, DollarSign } from 'lucide-react';

interface Model {
  id: string;
  provider_id: string;
  name: string;
  release_date: string;
  current_status: 'available' | 'restricted' | 'deprecated' | 'limited_rollout';
  description: string;
  provider_name: string;
  provider_logo_url: string;
}

interface Event {
  id: string;
  model_id: string;
  event_type: 'launch' | 'update' | 'deprecation' | 'restriction' | 'pricing_change';
  summary: string;
  source_url: string;
  published_date: string;
  impact_score: 'major' | 'minor';
  region_affected: string;
}

interface ModelProfileProps {
  modelId: string;
  onNavigate: (hash: string) => void;
}

export const ModelProfile: React.FC<ModelProfileProps> = ({ modelId, onNavigate }) => {
  const [model, setModel] = useState<Model | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, [modelId]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelsRes, eventsRes] = await Promise.all([
        fetch('http://localhost:3001/api/models'),
        fetch('http://localhost:3001/api/events')
      ]);

      if (!modelsRes.ok || !eventsRes.ok) {
        throw new Error('Failed to load profile details.');
      }

      const modelsData: Model[] = await modelsRes.json();
      const eventsData: Event[] = await eventsRes.json();

      const currentModel = modelsData.find((m) => m.id === modelId);
      if (!currentModel) {
        throw new Error(`Model with ID "${modelId}" was not found.`);
      }

      // Filter events for this model and sort chronologically (oldest first - Launch -> Updates)
      const modelEvents = eventsData
        .filter((e) => e.model_id === modelId)
        .sort((a, b) => new Date(a.published_date).getTime() - new Date(b.published_date).getTime());

      setModel(currentModel);
      setEvents(modelEvents);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Model['current_status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Available / General Access
          </span>
        );
      case 'restricted':
        return (
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Restricted Access
          </span>
        );
      case 'deprecated':
        return (
          <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Deprecated / Retired
          </span>
        );
      case 'limited_rollout':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Limited Rollout / Beta
          </span>
        );
      default:
        return null;
    }
  };

  const getEventIcon = (type: Event['event_type']) => {
    const baseClass = "h-5 w-5";
    switch (type) {
      case 'launch':
        return <Rocket className={`${baseClass} text-event-launch`} />;
      case 'update':
        return <ArrowUpCircle className={`${baseClass} text-event-update`} />;
      case 'deprecation':
        return <Trash2 className={`${baseClass} text-event-deprecation`} />;
      case 'restriction':
        return <Shield className={`${baseClass} text-event-restriction`} />;
      case 'pricing_change':
        return <DollarSign className={`${baseClass} text-event-pricing`} />;
      default:
        return <Calendar className={`${baseClass} text-slate-400`} />;
    }
  };

  const getEventBorderColor = (type: Event['event_type']) => {
    switch (type) {
      case 'launch': return 'border-event-launch';
      case 'update': return 'border-event-update';
      case 'deprecation': return 'border-event-deprecation';
      case 'restriction': return 'border-event-restriction';
      case 'pricing_change': return 'border-event-pricing';
      default: return 'border-slate-500';
    }
  };

  const getEventBgColor = (type: Event['event_type']) => {
    switch (type) {
      case 'launch': return 'bg-event-launch/5 border-event-launch/20';
      case 'update': return 'bg-event-update/5 border-event-update/20';
      case 'deprecation': return 'bg-event-deprecation/5 border-event-deprecation/20';
      case 'restriction': return 'bg-event-restriction/5 border-event-restriction/20';
      case 'pricing_change': return 'bg-event-pricing/5 border-event-pricing/20';
      default: return 'bg-slate-500/5 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-dark-border dark:bg-dark-border light:bg-slate-200 mx-auto rounded"></div>
        <div className="h-8 w-64 bg-dark-border dark:bg-dark-border light:bg-slate-200 mx-auto rounded"></div>
        <div className="h-20 w-full bg-dark-border dark:bg-dark-border light:bg-slate-200 rounded-xl mt-8"></div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold dark:text-dark-text light:text-light-text">Profile Unreachable</h2>
        <p className="text-sm text-dark-muted light:text-slate-600">
          {error || 'The model details could not be loaded.'}
        </p>
        <button
          onClick={() => onNavigate('#/dashboard')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation and Back */}
      <button
        onClick={() => onNavigate('#/dashboard')}
        className="group flex items-center gap-1.5 text-sm font-semibold text-dark-muted hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      {/* Model Detail Header Block */}
      <div className="p-8 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card dark:bg-dark-card light:bg-white mb-10 shadow-sm relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {model.provider_logo_url ? (
              <img
                src={model.provider_logo_url}
                alt={model.provider_name}
                className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700/50 p-1.5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center font-mono font-bold text-emerald-400">
                {model.provider_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight dark:text-dark-text light:text-light-text">
                {model.name}
              </h1>
              <p className="text-xs text-dark-muted font-mono mt-0.5 uppercase tracking-wider font-semibold">
                Developer: {model.provider_name}
              </p>
            </div>
          </div>
          <div className="shrink-0">{getStatusBadge(model.current_status)}</div>
        </div>

        <div className="space-y-4 text-sm">
          <p className="dark:text-slate-300 light:text-slate-700 leading-relaxed text-base">
            {model.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-dark-border/40 dark:border-dark-border/40 light:border-slate-100 pt-4 font-mono text-xs text-dark-muted">
            <div>
              <span className="block font-bold dark:text-slate-400 light:text-slate-600 mb-1">INITIAL LAUNCH</span>
              <span className="dark:text-dark-text light:text-light-text font-semibold">{model.release_date || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-bold dark:text-slate-400 light:text-slate-600 mb-1">MODEL KEY</span>
              <span className="dark:text-dark-text light:text-light-text font-semibold">{model.id}</span>
            </div>
            <div>
              <span className="block font-bold dark:text-slate-400 light:text-slate-600 mb-1">TOTAL EVENTS</span>
              <span className="dark:text-dark-text light:text-light-text font-semibold">{events.length}</span>
            </div>
            <div>
              <span className="block font-bold dark:text-slate-400 light:text-slate-600 mb-1">LATEST STATUS</span>
              <span className="dark:text-dark-text light:text-light-text font-semibold capitalize">{model.current_status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Timeline Section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-8 dark:text-dark-text light:text-light-text flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-400 animate-pulse" />
          Lifecycle Event Timeline
        </h2>

        {events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-dark-border dark:border-dark-border light:border-light-border rounded-xl bg-dark-card/10 dark:bg-dark-card/10 light:bg-slate-50">
            <p className="text-sm text-dark-muted light:text-slate-600">
              No specific operational events registered for this model yet.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-dark-border dark:border-dark-border light:border-slate-200 ml-4 md:ml-32 pl-6 md:pl-8 space-y-12 pb-6">
            {events.map((evt, idx) => (
              <div key={evt.id} className="relative group">
                
                {/* Left Date column (Desktop only) */}
                <div className="hidden md:block absolute -left-40 top-1 text-right w-28">
                  <span className="text-xs font-mono font-bold text-dark-muted block">
                    {evt.published_date}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider font-semibold">
                    Step {idx + 1}
                  </span>
                </div>

                {/* Timeline node node marker */}
                <span className={`absolute -left-[35px] top-0.5 rounded-full p-1 border-2 bg-dark-bg dark:bg-dark-bg light:bg-slate-100 flex items-center justify-center transition-all group-hover:scale-110 shadow-md ${getEventBorderColor(
                  evt.event_type
                )}`}>
                  {getEventIcon(evt.event_type)}
                </span>

                {/* Timeline Card */}
                <div className={`p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/50 dark:bg-dark-card/50 light:bg-white transition-all duration-300 ${getEventBgColor(
                  evt.event_type
                )}`}>
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-dark-border/30 dark:border-dark-border/30 light:border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono border rounded px-2 py-0.5 uppercase tracking-wider ${
                        evt.event_type === 'launch' ? 'text-event-launch border-event-launch/30 bg-event-launch/10' :
                        evt.event_type === 'update' ? 'text-event-update border-event-update/30 bg-event-update/10' :
                        evt.event_type === 'deprecation' ? 'text-event-deprecation border-event-deprecation/30 bg-event-deprecation/10' :
                        evt.event_type === 'restriction' ? 'text-event-restriction border-event-restriction/30 bg-event-restriction/10' :
                        'text-event-pricing border-event-pricing/30 bg-event-pricing/10'
                      }`}>
                        {evt.event_type.replace('_', ' ')}
                      </span>
                      {evt.impact_score === 'major' && (
                        <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                          MAJOR
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-dark-muted font-mono flex items-center gap-2">
                      <span className="md:hidden font-bold">{evt.published_date}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="uppercase font-semibold text-[10px] tracking-wide">
                        Affects: {evt.region_affected || 'Global'}
                      </span>
                    </div>
                  </div>

                  {/* Summary content */}
                  <p className="dark:text-slate-300 light:text-slate-700 text-sm leading-relaxed mb-3">
                    {evt.summary}
                  </p>

                  {/* View link */}
                  {evt.source_url && (
                    <a
                      href={evt.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                    >
                      <span>Reference Document</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
