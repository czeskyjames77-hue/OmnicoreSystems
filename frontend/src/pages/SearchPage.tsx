import React, { useState } from 'react';
import { Search, Shield, Zap, BarChart3, ChevronRight, Globe, Lock, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      navigate(`/audit?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white selection:bg-[#e11d48]/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#e11d48]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#e11d48]/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0b0c10]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#e11d48] to-[#9f1239] rounded-xl flex items-center justify-center shadow-lg shadow-[#e11d48]/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic">
              Omnicore <span className="text-[#e11d48]">Systeme</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Technologie</a>
            <a href="#security" className="hover:text-white transition-colors">Sicherheit</a>
            <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
          </div>

          <button 
            onClick={() => navigate('/portal/login')} 
            className="px-6 py-2.5 rounded-full border border-white/10 hover:border-[#e11d48]/50 hover:bg-[#e11d48]/5 transition-all text-sm font-semibold"
          >
            Portal Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e11d48]/10 border border-[#e11d48]/20 text-[#e11d48] text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" /> Next-Gen AI Compliance
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
            Deep-Scan Audit für <span className="text-[#e11d48]">KI-Systeme.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            Analysieren Sie Ihre Web-Infrastruktur auf KI-Risiken, Compliance-Lücken und 
            Sicherheits-Vulnerabilitäten in Echtzeit.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-[#e11d48]/20 blur-2xl group-focus-within:bg-[#e11d48]/30 transition-all rounded-full"></div>
            <div className="relative flex items-center p-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-2xl focus-within:border-[#e11d48]/50 transition-all">
              <div className="pl-6 pr-4">
                <Globe className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ihre-website.de"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 py-4 text-lg"
              />
              <button 
                type="submit"
                className="bg-[#e11d48] hover:bg-[#be123c] text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#e11d48]/20"
              >
                Audit Starten <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-32">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#e11d48]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#e11d48]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6 text-[#e11d48]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Core Privacy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vollständige Analyse der Datenabfluss-Vektoren und DSGVO-Konformität Ihrer KI-Schnittstellen.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#e11d48]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#e11d48]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-[#e11d48]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Bias Detection</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Identifikation von algorithmischen Verzerrungen und unethischen Entscheidungsmustern.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#e11d48]/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-[#e11d48]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-[#e11d48]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Rapid Response</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Automatisierte Berichterstellung und Handlungsempfehlungen für Ihre IT-Infrastruktur.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-500 text-sm font-mono">
            &copy; 2026 OMNICORE SYSTEME. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-[#e11d48] transition-colors">Impressum</a>
            <a href="#" className="hover:text-[#e11d48] transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-[#e11d48] transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SearchPage;