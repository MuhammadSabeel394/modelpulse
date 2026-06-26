import React, { useEffect, useState } from 'react';
import { Layers, HelpCircle, Activity, DollarSign, Calendar, RefreshCw, Check, X } from 'lucide-react';

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
  event_type: string;
  summary: string;
  published_date: string;
}

// Pricing and Capabilities lookup table for visual richness
const MODEL_ADDITIONAL_METRICS: Record<string, { pricing: string; context: string; capabilities: string[] }> = {
  'gpt-4o': {
    pricing: '$2.50 Input / $10.00 Output (per M tokens)',
    context: '128,000 tokens',
    capabilities: ['Multimodal (Text/Vision/Audio)', 'Real-time conversation', 'Highly advanced coding']
  },
  'gpt-4-turbo': {
    pricing: '$10.00 Input / $30.00 Output (per M tokens)',
    context: '128,000 tokens',
    capabilities: ['Text and Vision support', 'Deep logical reasoning', 'Complex instructions']
  },
  'gpt-3.5-turbo': {
    pricing: '$0.50 Input / $1.50 Output (per M tokens)',
    context: '16,385 tokens',
    capabilities: ['Fast text-only generations', 'Legacy workflows support', 'Cost-efficient processing']
  },
  'gpt-4o-mini': {
    pricing: '$0.15 Input / $0.60 Output (per M tokens)',
    context: '128,000 tokens',
    capabilities: ['Extremely low cost', 'Speed optimized', 'Structured JSON outputs']
  },
  'claude-3-5-sonnet': {
    pricing: '$3.00 Input / $15.00 Output (per M tokens)',
    context: '200,000 tokens',
    capabilities: ['Computer Use API support', 'SOTA coding intelligence', 'Agentic task execution']
  },
  'claude-3-opus': {
    pricing: '$15.00 Input / $75.00 Output (per M tokens)',
    context: '200,000 tokens',
    capabilities: ['Complex mathematical reasoning', 'Multi-step planning', 'Advanced research parsing']
  },
  'claude-3-haiku': {
    pricing: '$0.25 Input / $1.25 Output (per M tokens)',
    context: '200,000 tokens',
    capabilities: ['Instantaneous latency', 'High throughput workloads', 'Lightweight text classification']
  },
  'gemini-1-5-pro': {
    pricing: '$1.25 Input / $5.00 Output (per M tokens) (<=128k)',
    context: '2,000,000 tokens',
    capabilities: ['Ultra-large context window', 'Native multimodal reasoning', 'Video & audio ingestion']
  },
  'gemini-1-5-flash': {
    pricing: '$0.075 Input / $0.30 Output (per M tokens) (<=128k)',
    context: '1,000,000 tokens',
    capabilities: ['High speed multimodal', 'Very low cost API', 'Summary & parsing pipelines']
  },
  'llama-3-1-405b': {
    pricing: 'Open Weights (Free to host / API ~$2.60/M)',
    context: '128,000 tokens',
    capabilities: ['Distillation oracle', 'Massive open parameter coding', 'Synthetic dataset generator']
  },
  'llama-3-1-70b': {
    pricing: 'Open Weights (Free to host / API ~$0.50/M)',
    context: '128,000 tokens',
    capabilities: ['Finetuning optimization', 'Excellent agentic workflows', 'Local hosting capability']
  },
  'mistral-large-2': {
    pricing: '$2.00 Input / $6.00 Output (per M tokens)',
    context: '128,000 tokens',
    capabilities: ['Multilingual function calls', 'Native European hosting options', 'Strong coding/reasoning']
  },
  'codestral': {
    pricing: '$0.20 Input / $0.60 Output (per M tokens)',
    context: '32,000 tokens',
    capabilities: ['Specialized code generation', 'Fill-In-The-Middle (FIM) APIs', '80+ coding languages supported']
  }
};

export const Comparison: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active selections (can compare up to 3 models side-by-side)
  const [selectedIds, setSelectedIds] = useState<string[]>(['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro']);

  useEffect(() => {
    fetchModelsAndEvents();
  }, []);

  const fetchModelsAndEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelsRes, eventsRes] = await Promise.all([
        fetch('http://localhost:3001/api/models'),
        fetch('http://localhost:3001/api/events')
      ]);

      if (!modelsRes.ok || !eventsRes.ok) {
        throw new Error('Failed to load database comparison vectors.');
      }

      const modelsData = await modelsRes.json();
      const eventsData = await eventsRes.json();

      setModels(modelsData);
      setEvents(eventsData);
      
      // Auto fallback if default models aren't loaded
      if (modelsData.length > 2) {
        setSelectedIds([modelsData[0].id, modelsData[4]?.id || modelsData[1].id, modelsData[7]?.id || modelsData[2].id]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not establish connection with backend APIs.');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (index: number, id: string) => {
    const nextIds = [...selectedIds];
    nextIds[index] = id;
    setSelectedIds(nextIds);
  };

  const removeColumn = (index: number) => {
    if (selectedIds.length <= 2) return; // Keep at least 2 models for comparison
    const nextIds = selectedIds.filter((_, idx) => idx !== index);
    setSelectedIds(nextIds);
  };

  const addColumn = () => {
    if (selectedIds.length >= 3) return; // Limit to 3 columns max
    // Find a model ID that isn't currently selected
    const unselected = models.find((m) => !selectedIds.includes(m.id));
    if (unselected) {
      setSelectedIds([...selectedIds, unselected.id]);
    } else if (models.length > 0) {
      setSelectedIds([...selectedIds, models[0].id]);
    }
  };

  const getLatestEvent = (modelId: string) => {
    const modelEvents = events.filter((e) => e.model_id === modelId);
    if (modelEvents.length === 0) return 'No updates tracked yet.';
    
    // Sort descending by date and return the first summary
    const sorted = [...modelEvents].sort(
      (a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
    );
    return `[${sorted[0].published_date}] ${sorted[0].summary}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'restricted': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'deprecated': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'limited_rollout': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-dark-border dark:bg-dark-border light:bg-slate-200 mx-auto rounded"></div>
        <div className="h-4 w-96 bg-dark-border dark:bg-dark-border light:bg-slate-200 mx-auto rounded"></div>
        <div className="h-96 w-full bg-dark-border dark:bg-dark-border light:bg-slate-200 rounded-xl mt-12"></div>
      </div>
    );
  }

  if (error || models.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <Activity className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-bold dark:text-dark-text light:text-light-text">Comparison View Unreachable</h2>
        <p className="text-sm text-dark-muted light:text-slate-600">
          We could not load comparison datasets. Ensure your server is active on port 3001.
        </p>
        <button
          onClick={fetchModelsAndEvents}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-dark-text light:text-light-text flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-500" />
            Frontier Model Comparator
          </h1>
          <p className="text-dark-muted light:text-slate-600 mt-1">
            Analyze capabilities, token pricings, and operational statuses side-by-side.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length < 3 && (
            <button
              onClick={addColumn}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
            >
              + Add Model to Compare
            </button>
          )}
          <button
            onClick={fetchModelsAndEvents}
            className="p-2.5 border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card dark:bg-dark-card light:bg-white rounded-lg text-dark-muted hover:text-emerald-500"
            title="Refresh Data"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Grid Comparison Matrix */}
      <div className="border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/30 dark:bg-dark-card/30 light:bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-dark-border dark:divide-dark-border light:divide-light-border">
          
          {/* Left Metadata Labels Column (Desktop only) */}
          <div className="hidden md:block md:col-span-3 bg-dark-card/40 dark:bg-dark-card/40 light:bg-slate-50 font-mono text-[11px] font-bold text-dark-muted uppercase tracking-wider divide-y divide-dark-border dark:divide-dark-border light:divide-light-border">
            <div className="p-6 h-[100px] flex items-center">Model Selection</div>
            <div className="p-6 h-[80px] flex items-center">Developer / Provider</div>
            <div className="p-6 h-[70px] flex items-center">Initial Release Date</div>
            <div className="p-6 h-[70px] flex items-center">Current Lifecycle Status</div>
            <div className="p-6 h-[90px] flex items-center">Base API Pricing Tier</div>
            <div className="p-6 h-[70px] flex items-center">Native Context Window</div>
            <div className="p-6 h-[170px] flex items-center">Core Capabilities & Modalities</div>
            <div className="p-6 min-h-[140px] flex items-center">Latest Tracked Event / Summary</div>
          </div>

          {/* Model Comparison Columns */}
          {selectedIds.map((selectedId, colIdx) => {
            const modelObj = models.find((m) => m.id === selectedId) || models[0];
            const extra = MODEL_ADDITIONAL_METRICS[modelObj.id] || {
              pricing: 'Unknown base pricing',
              context: '128,000 tokens',
              capabilities: ['Multimodal reasoning support', 'Instruction fine-tuned']
            };

            return (
              <div 
                key={`${selectedId}-${colIdx}`} 
                className={`divide-y divide-dark-border dark:divide-dark-border light:divide-light-border text-sm relative ${
                  selectedIds.length === 2 ? 'md:col-span-4.5 lg:col-span-4.5' : 'md:col-span-3 lg:col-span-3'
                } ${
                  selectedIds.length === 2 && colIdx === 0 ? 'md:col-span-5 lg:col-span-5' : ''
                } flex-grow`}
              >
                {/* Column Close Action (only if > 2 selected models) */}
                {selectedIds.length > 2 && (
                  <button
                    onClick={() => removeColumn(colIdx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-500/10 text-dark-muted hover:text-red-400 transition-colors z-10"
                    title="Remove Column"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Row: Selection Dropdown */}
                <div className="p-5 h-[100px] flex flex-col justify-center bg-dark-card/50 dark:bg-dark-card/50 light:bg-slate-100/50">
                  <label className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider mb-1.5">
                    Select Model {colIdx + 1}
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => handleModelSelect(colIdx, e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border dark:bg-dark-bg dark:border-dark-border light:bg-white light:border-light-border dark:text-dark-text light:text-light-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row: Provider info */}
                <div className="p-5 h-[80px] flex items-center gap-3">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block shrink-0 w-24">
                    Developer:
                  </span>
                  {modelObj.provider_logo_url ? (
                    <img
                      src={modelObj.provider_logo_url}
                      alt={modelObj.provider_name}
                      className="h-7 w-7 rounded bg-slate-950 border border-slate-700/50 p-0.5 object-contain"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                      {modelObj.provider_name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold dark:text-dark-text light:text-light-text">
                    {modelObj.provider_name}
                  </span>
                </div>

                {/* Row: Release date */}
                <div className="p-5 h-[70px] flex items-center">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block shrink-0 w-24">
                    Release Date:
                  </span>
                  <span className="font-mono text-xs dark:text-dark-text light:text-light-text flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {modelObj.release_date || 'Unknown'}
                  </span>
                </div>

                {/* Row: Status */}
                <div className="p-5 h-[70px] flex items-center">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block shrink-0 w-24">
                    Status:
                  </span>
                  <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadgeColor(
                    modelObj.current_status
                  )}`}>
                    {modelObj.current_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Row: Pricing */}
                <div className="p-5 h-[90px] flex flex-col justify-center">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block mb-1">
                    API Pricing:
                  </span>
                  <span className="font-mono text-xs text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-semibold flex items-start gap-1">
                    <DollarSign className="h-4 w-4 shrink-0 mt-0.5" />
                    {extra.pricing}
                  </span>
                </div>

                {/* Row: Context length */}
                <div className="p-5 h-[70px] flex items-center">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block shrink-0 w-24">
                    Context size:
                  </span>
                  <span className="font-mono text-xs dark:text-dark-text light:text-light-text">
                    {extra.context}
                  </span>
                </div>

                {/* Row: Capabilities List */}
                <div className="p-5 h-[170px] flex flex-col justify-center space-y-2 overflow-y-auto">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block mb-1">
                    Capabilities:
                  </span>
                  {extra.capabilities.map((cap, capIdx) => (
                    <div key={capIdx} className="flex items-start gap-2 text-xs text-dark-muted dark:text-dark-text/90 light:text-slate-800">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>

                {/* Row: Latest event */}
                <div className="p-5 min-h-[140px] flex flex-col justify-center bg-dark-card/20 dark:bg-dark-card/20 light:bg-slate-50/50">
                  <span className="md:hidden text-[10px] font-bold font-mono text-dark-muted uppercase tracking-wider block mb-1.5">
                    Latest update:
                  </span>
                  <p className="text-xs text-dark-muted dark:text-slate-400 light:text-slate-600 leading-relaxed italic">
                    {getLatestEvent(modelObj.id)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology notice helper */}
      <div className="mt-6 p-4 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/10 dark:bg-dark-card/10 light:bg-slate-50 text-xs text-dark-muted flex items-start gap-2 max-w-3xl">
        <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Analyst Note:</strong> Metric values are estimated using official developer pricing documentation. 
          Dynamic event tracking is processed automatically via our pipeline services. Check out specific model pages 
          by clicking model names from the dashboard feed to review their complete timeline histories.
        </p>
      </div>
    </div>
  );
};
