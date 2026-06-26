import { useEffect, useState } from 'react';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ModelProfile } from './pages/ModelProfile';
import { Comparison } from './pages/Comparison';
import { Analytics } from './pages/Analytics';
import { AdminPanel } from './pages/AdminPanel';
import { Methodology } from './pages/Methodology';
import { Sun, Moon, Terminal, Menu, X } from 'lucide-react';

export default function App() {
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '#/');
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Hash router listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      setMobileMenuOpen(false);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme synchronization
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  // Simple parser to extract params e.g. #/model/gpt-4o
  const routeParser = () => {
    const hash = currentHash;
    if (hash === '#/' || hash === '') return { page: 'landing' };
    if (hash.startsWith('#/dashboard')) return { page: 'dashboard' };
    if (hash.startsWith('#/comparison')) return { page: 'comparison' };
    if (hash.startsWith('#/analytics')) return { page: 'analytics' };
    if (hash.startsWith('#/admin')) return { page: 'admin' };
    if (hash.startsWith('#/methodology')) return { page: 'methodology' };
    if (hash.startsWith('#/model/')) {
      const parts = hash.split('/');
      return { page: 'model-profile', id: parts[2] };
    }
    return { page: 'landing' };
  };

  const route = routeParser();

  const getNavLinkClass = (pageName: string) => {
    const base = "px-3 py-2 rounded-md text-sm font-semibold tracking-wide transition-colors";
    const active = "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
    const inactive = "dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 dark:hover:text-emerald-400 light:hover:text-emerald-600";
    
    return `${base} ${route.page === pageName ? active : inactive}`;
  };

  return (
    <div className="min-h-screen transition-colors duration-200 dark:bg-dark-bg light:bg-light-bg dark:text-dark-text light:text-light-text flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 border-b border-dark-border dark:border-dark-border light:border-light-border bg-dark-card/85 dark:bg-dark-card/85 light:bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => navigateTo('#/')}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono font-bold text-lg tracking-wider dark:text-white light:text-slate-900">
                MODEL<span className="text-emerald-500">PULSE</span>
              </span>
              <span className="text-[10px] block font-mono text-dark-muted -mt-1 font-semibold tracking-widest uppercase">
                Intelligence Tracker
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-2">
            <button onClick={() => navigateTo('#/dashboard')} className={getNavLinkClass('dashboard')}>
              Dashboard
            </button>
            <button onClick={() => navigateTo('#/comparison')} className={getNavLinkClass('comparison')}>
              Comparison
            </button>
            <button onClick={() => navigateTo('#/analytics')} className={getNavLinkClass('analytics')}>
              Analytics
            </button>
            <button onClick={() => navigateTo('#/admin')} className={getNavLinkClass('admin')}>
              Admin Panel
            </button>
            <button onClick={() => navigateTo('#/methodology')} className={getNavLinkClass('methodology')}>
              Methodology
            </button>
          </nav>

          {/* Theme & Mobile Menu Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-dark-border dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-dark-border dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-border dark:border-dark-border light:border-light-border bg-dark-card dark:bg-dark-card light:bg-white px-4 py-4 space-y-2 flex flex-col shadow-lg">
            <button
              onClick={() => navigateTo('#/dashboard')}
              className="text-left w-full px-4 py-2.5 rounded-lg hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 font-semibold"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigateTo('#/comparison')}
              className="text-left w-full px-4 py-2.5 rounded-lg hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 font-semibold"
            >
              Comparison
            </button>
            <button
              onClick={() => navigateTo('#/analytics')}
              className="text-left w-full px-4 py-2.5 rounded-lg hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 font-semibold"
            >
              Analytics
            </button>
            <button
              onClick={() => navigateTo('#/admin')}
              className="text-left w-full px-4 py-2.5 rounded-lg hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 font-semibold"
            >
              Admin Panel
            </button>
            <button
              onClick={() => navigateTo('#/methodology')}
              className="text-left w-full px-4 py-2.5 rounded-lg hover:bg-dark-border dark:hover:bg-dark-border light:hover:bg-slate-100 font-semibold"
            >
              Methodology
            </button>
          </div>
        )}
      </header>

      {/* Main Body Content */}
      <main className="flex-grow">
        {route.page === 'landing' && <Landing onNavigate={navigateTo} />}
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'model-profile' && <ModelProfile modelId={route.id || ''} onNavigate={navigateTo} />}
        {route.page === 'comparison' && <Comparison />}
        {route.page === 'analytics' && <Analytics />}
        {route.page === 'admin' && <AdminPanel />}
        {route.page === 'methodology' && <Methodology />}
      </main>
    </div>
  );
}
