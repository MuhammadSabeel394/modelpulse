import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, ExternalLink, CalendarDays, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  model_id: string;
  model_name: string;
  provider_id: string;
  provider_name: string;
  provider_logo_url: string;
  event_type: 'launch' | 'update' | 'deprecation' | 'restriction' | 'pricing_change';
  summary: string;
  raw_source_text: string;
  source_url: string;
  published_date: string;
  impact_score: 'major' | 'minor';
  region_affected: string;
  is_verified: number;
}

interface Provider {
  id: string;
  name: string;
  logo_url: string;
  website: string;
}

export const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest'); // newest, oldest, impact

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, providersRes] = await Promise.all([
        fetch('http://localhost:3001/api/events'),
        fetch('http://localhost:3001/api/providers')
      ]);

      if (!eventsRes.ok || !providersRes.ok) {
        throw new Error('Failed to load database records.');
      }

      const eventsData = await eventsRes.json();
      const providersData = await providersRes.json();

      setEvents(eventsData);
      setProviders(providersData);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the ModelPulse backend. Please ensure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProvider('all');
    setSelectedTypes([]);
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  // Helper styles
  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'launch':
        return 'bg-event-launch/10 text-event-launch border-event-launch/20';
      case 'update':
        return 'bg-event-update/10 text-event-update border-event-update/20';
      case 'deprecation':
        return 'bg-event-deprecation/10 text-event-deprecation border-event-deprecation/20';
      case 'restriction':
        return 'bg-event-restriction/10 text-event-restriction border-event-restriction/20';
      case 'pricing_change':
        return 'bg-event-pricing/10 text-event-pricing border-event-pricing/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getEventGlowClass = (type: string) => {
    switch (type) {
      case 'launch':
        return 'hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      case 'update':
        return 'hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]';
      case 'deprecation':
        return 'hover:shadow-[0_0_15px_rgba(148,163,184,0.1)]';
      case 'restriction':
        return 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'pricing_change':
        return 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]';
      default:
        return '';
    }
  };

  // Filtering & Sorting Logic
  const filteredEvents = events
    .filter((event) => {
      // 1. Search Query
      const matchSearch =
        event.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.summary.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Provider Filter
      const matchProvider = selectedProvider === 'all' || event.provider_id === selectedProvider;

      // 3. Event Type Filter
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(event.event_type);

      // 4. Date Range Filter
      let matchDate = true;
      if (startDate) {
        matchDate = matchDate && new Date(event.published_date) >= new Date(startDate);
      }
      if (endDate) {
        matchDate = matchDate && new Date(event.published_date) <= new Date(endDate);
      }

      return matchSearch && matchProvider && matchType && matchDate;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.published_date).getTime() - new Date(b.published_date).getTime();
      }
      if (sortBy === 'impact') {
        // Major first
        if (a.impact_score === 'major' && b.impact_score === 'minor') return -1;
        if (a.impact_score === 'minor' && b.impact_score === 'major') return 1;
        return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-dark-text light:text-light-text flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Model Lifecycle Feed
          </h1>
          <p className="text-dark-muted light:text-slate-600 mt-1">
            Analyzing changes across {events.length} tracked events from {providers.length} developers.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border dark:bg-dark-card dark:border-dark-border light:bg-white light:border-light-border dark:text-dark-text light:text-light-text hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start gap-3 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Backend Connection Issue</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 text-xs bg-red-900/40 hover:bg-red-900/60 text-white font-semibold px-3 py-1.5 rounded"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/50 dark:bg-dark-card/50 light:bg-white space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-dark-border dark:border-dark-border light:border-light-border pb-4">
              <span className="font-semibold text-sm tracking-wide uppercase dark:text-dark-text light:text-light-text flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-500" /> Filters
              </span>
              <button
                onClick={clearFilters}
                className="text-xs text-dark-muted hover:text-emerald-500 font-semibold"
              >
                Clear All
              </button>
            </div>

            {/* Provider Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-dark-text/70 light:text-slate-500">
                Developer / Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border dark:bg-dark-bg dark:border-dark-border light:bg-slate-50 light:border-light-border dark:text-dark-text light:text-light-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-dark-text/70 light:text-slate-500">
                Event Type
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'launch', label: 'Launches', color: 'bg-event-launch' },
                  { id: 'update', label: 'Updates / Upgrades', color: 'bg-event-update' },
                  { id: 'deprecation', label: 'Deprecations', color: 'bg-event-deprecation' },
                  { id: 'restriction', label: 'Restrictions', color: 'bg-event-restriction' },
                  { id: 'pricing_change', label: 'Pricing Changes', color: 'bg-event-pricing' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeToggle(type.id)}
                    className={`flex items-center justify-between text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedTypes.includes(type.id)
                        ? 'border-emerald-500/50 bg-emerald-500/5 font-medium dark:text-dark-text light:text-light-text'
                        : 'border-dark-border dark:border-dark-border light:border-light-border dark:text-dark-text/80 light:text-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${type.color}`}></span>
                      {type.label}
                    </span>
                    {selectedTypes.includes(type.id) && (
                      <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-dark-text/70 light:text-slate-500">
                Date Range
              </label>
              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-dark-muted font-bold font-mono">FROM</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border dark:bg-dark-bg dark:border-dark-border light:bg-slate-50 light:border-light-border dark:text-dark-text light:text-light-text rounded-lg pl-14 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-dark-muted font-bold font-mono">TO</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border dark:bg-dark-bg dark:border-dark-border light:bg-slate-50 light:border-light-border dark:text-dark-text light:text-light-text rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2.5 border-t border-dark-border dark:border-dark-border light:border-light-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider dark:text-dark-text/70 light:text-slate-500">
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border dark:bg-dark-bg dark:border-dark-border light:bg-slate-50 light:border-light-border dark:text-dark-text light:text-light-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="newest">Published (Newest)</option>
                <option value="oldest">Published (Oldest)</option>
                <option value="impact">Highest Impact Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Dashboard Feed column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar row */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search model name, developer, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-card border border-dark-border dark:bg-dark-card dark:border-dark-border light:bg-white light:border-light-border dark:text-dark-text light:text-light-text rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
            />
          </div>

          {/* Skeleton Loaders */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/30 dark:bg-dark-card/30 light:bg-white animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-dark-border dark:bg-dark-border light:bg-slate-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-dark-border dark:bg-dark-border light:bg-slate-200 rounded"></div>
                      <div className="h-3 w-16 bg-dark-border dark:bg-dark-border light:bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-dark-border dark:bg-dark-border light:bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 p-8 border border-dashed border-dark-border dark:border-dark-border light:border-light-border rounded-xl bg-dark-card/10 dark:bg-dark-card/10 light:bg-slate-50 space-y-4">
              <AlertCircle className="h-10 w-10 text-dark-muted mx-auto" />
              <h3 className="font-semibold text-lg dark:text-dark-text light:text-light-text">No Events Match Filters</h3>
              <p className="text-sm text-dark-muted light:text-slate-600 max-w-sm mx-auto">
                Try modifying your search text, choosing a different provider, or resetting the date inputs.
              </p>
              <button
                onClick={clearFilters}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Feed List */
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-6 rounded-xl border border-dark-border dark:border-dark-border light:border-light-border bg-dark-card dark:bg-dark-card light:bg-white transition-all duration-300 ${getEventGlowClass(
                    event.event_type
                  )}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dark-border/50 dark:border-dark-border/50 light:border-slate-100 pb-4 mb-4">
                    {/* Model Details */}
                    <div className="flex items-center gap-3">
                      {event.provider_logo_url ? (
                        <img
                          src={event.provider_logo_url}
                          alt={event.provider_name}
                          className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700/50 p-1 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                          {event.provider_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="font-bold text-lg dark:text-dark-text light:text-light-text flex items-center gap-2">
                          <a href={`#/model/${event.model_id}`} className="hover:text-emerald-400 transition-colors">
                            {event.model_name}
                          </a>
                          <span className="text-xs text-dark-muted font-mono font-normal">
                            by {event.provider_name}
                          </span>
                        </h2>
                        {/* Event Date and Region */}
                        <div className="flex items-center gap-3 text-xs text-dark-muted mt-0.5">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                            {event.published_date}
                          </span>
                          <span>•</span>
                          <span className="uppercase tracking-wider font-semibold font-mono text-[10px]">
                            Region: {event.region_affected || 'Global'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge Tags */}
                    <div className="flex items-center gap-2">
                      {event.impact_score === 'major' && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-1 rounded font-mono uppercase tracking-wider animate-pulse">
                          MAJOR IMPACT
                        </span>
                      )}
                      <span className={`border text-xs px-2.5 py-1 rounded-full font-semibold tracking-wide ${getEventBadgeClass(event.event_type)}`}>
                        {event.event_type.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p className="dark:text-slate-300 light:text-slate-700 text-sm leading-relaxed mb-4">
                    {event.summary}
                  </p>

                  {/* Links and Actions */}
                  <div className="flex items-center justify-between text-xs border-t border-dark-border/40 dark:border-dark-border/40 light:border-slate-100 pt-3">
                    <span className="text-dark-muted flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${event.is_verified ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      {event.is_verified ? 'Verified Pipeline' : 'Unverified Feed Item'}
                    </span>
                    
                    {event.source_url && (
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                      >
                        <span>View Source Document</span>
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
    </div>
  );
};
