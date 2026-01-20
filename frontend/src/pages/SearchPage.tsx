import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Search, Cpu, Globe, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
// WICHTIG: Stelle sicher, dass MOCK_RECENT_SEARCHES in deiner api.ts exportiert wird oder definiere es hier lokal
import { api } from '../api';

const MOCK_RECENT_SEARCHES = [
  { name: "Restaurant XYZ", location: "München, DE", status: "4 Verstöße", color: "text-primary" },
  { name: "Kanzlei Schmidt", location: "Berlin, DE", status: "Profil optimiert", color: "text-emerald-500" },
  { name: "Boutique Hotel Alpha", location: "Wien, AT", status: "Analyse läuft...", color: "text-blue-500" }
];

const SearchPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyName || !location) return;

    setIsSearching(true);
    try {
      // 1. ECHTER API CALL an dein Python-Backend
      const response = await api.get('/api/search', { 
        params: { name: companyName, address: location } 
      });
      
      if (response.data && !response.data.error) {
        // 2. NAVIGATION: Wir übergeben das ECHTE Ergebnis vom Backend an die AuditPage
        navigate('/audit', { 
          state: { 
            company: response.data // Enthält title, address, data_id etc.
          } 
        });
      } else {
        alert(response.data.error || "Firma konnte nicht gefunden werden.");
      }
    } catch (error) {
      console.error("Omnicore Search failed", error);
      alert("Verbindung zum Omnicore-Backend unterbrochen.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-red-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-8 py-6 flex justify-between items-center bg-[#0f172a]/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#e11d48] p-2 rounded-xl shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            OMNICORE <span className="text-[#e11d48]">SYSTEME</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
          <span className="cursor-default">KI-Technologie</span>
          <span className="cursor-default">Lösungen</span>
          <span className="cursor-default">Support</span>
        </div>
        <button className="bg-slate-800 px-6 py-2 rounded-lg text-sm font-bold border border-white/10 hover:bg-slate-700 transition-all">
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight mb-8 uppercase">
            Reputation <br />
            <span className="text-[#e11d48] italic">neu definiert</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
            Nutzen Sie modernste KI-Algorithmen von Omnicore Systeme, um geschäftsschädigende 
            Bewertungen zu identifizieren und rechtssicher zu entfernen.
          </p>
        </motion.div>

        {/* Search Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-slate-900/40 border border-white/10 p-2 md:p-4 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl max-w-4xl mx-auto"
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Firmenname"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 py-6 pl-16 pr-6 rounded-3xl outline-none focus:border-red-500/50 transition-all text-lg font-medium"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Standort (Stadt oder PLZ)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 py-6 pl-16 pr-6 rounded-3xl outline-none focus:border-red-500/50 transition-all text-lg font-medium"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#e11d48] px-10 py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-red-500/40 relative group overflow-hidden"
              disabled={isSearching}
            >
              <Shield className="w-5 h-5" />
              {isSearching ? 'Analysiere...' : 'Audit jetzt starten'}
            </motion.button>
          </form>
        </motion.div>

        {/* Trust Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
            <Cpu size={18} className="text-[#e11d48]" /> KI-Modell v4.2 aktiv
          </div>
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
            <Globe size={18} className="text-blue-500" /> Google Maps API verbunden
          </div>
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
            <CheckCircle size={18} className="text-emerald-500" /> DSGVO Konform
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;