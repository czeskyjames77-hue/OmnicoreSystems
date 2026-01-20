import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Activity, Trash2, Settings, 
  History, Download, MapPin, Star, AlertTriangle, 
  TrendingDown, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';

const AuditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Datenempfang von der SearchPage
  const company = location.state?.company || { name: 'Unbekanntes Unternehmen', address: 'Standort unbekannt', data_id: '' };

  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 2. ECHTER API CALL: Holt die Rezensionen vom Python-Backend
  useEffect(() => {
    const fetchReviews = async () => {
      if (!company.data_id) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get('/api/reviews', { 
          params: { 
            data_id: company.data_id,
            name: company.name 
          } 
        });
        setReviews(response.data);
      } catch (err) {
        console.error("Omnicore Audit Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [company.data_id]);

  // 3. ECHTE STATISTIK-BERECHNUNG
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { score: 100, critical: 0, confidence: 0 };
    
    const criticalReviews = reviews.filter(r => r.rating <= 3); // 3 Sterne zählen jetzt mit
    const criticalCount = criticalReviews.length;
    
    // Durchschnittliche Confidence der kritischen Fälle
    const avgConfidence = criticalCount > 0 
      ? Math.round(criticalReviews.reduce((acc, r) => acc + (r.confidence || 0), 0) / criticalCount)
      : 94;

    const score = Math.max(5, 100 - (criticalCount * 12));
    
    return { 
      score, 
      critical: criticalCount, 
      confidence: avgConfidence
    };
  }, [reviews]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleCleanupStart = () => {
    const selectedReviews = reviews.filter(r => selectedIds.has(r.id));
    navigate('/checkout', { state: { selectedReviews, company } });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0b0c10] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Shield className="w-16 h-16 text-[#e11d48]" />
          <p className="font-black uppercase tracking-[0.4em] text-xs text-[#e11d48]">KI-Protokoll wird geladen...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0c10] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 bg-slate-900/40 border-r border-white/5 p-8 flex flex-col justify-between">
        <div className="space-y-12">
          <div className="flex items-center gap-3">
            <div className="bg-[#e11d48] p-2 rounded-xl">
              <Shield size={20} />
            </div>
            <span className="font-black tracking-tighter text-lg uppercase">OMNICORE</span>
          </div>

          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <SidebarLink icon={<Activity size={18} />} label="KI-Analyse" />
            <SidebarLink icon={<Trash2 size={18} />} label="Bereinigung" />
          </nav>

          <div className="p-6 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl border border-red-500/20">
            <h4 className="font-black text-xs uppercase tracking-widest mb-3">Threat Level</h4>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${100 - stats.score}%` }}
                className="h-full bg-[#e11d48]"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              {stats.score < 50 ? 'Kritische Bedrohung erkannt.' : 'Reputation stabil.'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleCleanupStart}
          disabled={selectedIds.size === 0}
          className="w-full bg-[#e11d48] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] disabled:opacity-30"
        >
          Bereinigung starten ({selectedIds.size})
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <header className="mb-16">
          <div className="text-[#e11d48] font-black uppercase tracking-[0.3em] text-[10px] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Audit
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">{company.name}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
            <MapPin size={16} /> {company.address}
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StatCard label="Reputation Score" value={stats.score} unit="/100" />
          <StatCard label="Kritische Verstöße" value={stats.critical} color="text-[#e11d48]" />
          <StatCard label="Ø KI-Konfidenz" value={stats.confidence} unit="%" />
        </div>

        {/* Review Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-black tracking-tighter uppercase mb-8">Identifizierte Einträge</h3>
          {reviews.map((rev) => (
            <ReviewCard 
              key={rev.id} 
              review={rev} 
              isSelected={selectedIds.has(rev.id)} 
              onToggle={() => toggleSelection(rev.id)} 
            />
          ))}
        </div>
      </main>
    </div>
  );
};

// Hilfs-Komponenten
const SidebarLink = ({ icon, label, active = false }: any) => (
  <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-[#e11d48] text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-white'}`}>
    {icon} <span className="text-xs font-black uppercase tracking-widest">{label}</span>
  </div>
);

const StatCard = ({ label, value, unit, color = "text-white" }: any) => (
  <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[2rem]">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    <div className="text-4xl font-black flex items-baseline gap-1">
      <span className={color}>{value}</span>
      {unit && <span className="text-sm text-slate-600">{unit}</span>}
    </div>
  </div>
);

const ReviewCard = ({ review, isSelected, onToggle }: any) => {
  const isActionable = review.rating <= 3; // 1, 2 und 3 Sterne sind nun löschbar
  
  return (
    <div className={`bg-slate-900/20 border p-8 rounded-[2.5rem] transition-all ${isSelected ? 'border-[#e11d48] bg-red-500/5' : 'border-white/5'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-lg italic">{review.author || 'Anonymer Nutzer'}</h4>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < review.rating ? '#e11d48' : 'none'} stroke={i < review.rating ? '#e11d48' : '#334155'} />
            ))}
          </div>
        </div>

        {/* AI-Confidence Badge (Neu) */}
        {review.violation && (
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">AI-Confidence</p>
            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20">
              {review.confidence}%
            </span>
          </div>
        )}
      </div>

      <p className="text-slate-400 italic text-sm mb-6 leading-relaxed">"{review.text}"</p>
      
      {/* Dynamische Analyse-Anzeige (Neu) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className={`flex items-center gap-2 p-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest ${isActionable ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-slate-800/50 text-slate-500'}`}>
          <Activity size={12} />
          {review.violation ? `Analyse: ${review.violation}` : 'System-Status: Kein Handlungsbedarf'}
        </div>

        {isActionable && (
          <button 
            onClick={onToggle}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isSelected 
              ? 'bg-slate-800 text-white shadow-inner' 
              : 'bg-[#e11d48] text-white shadow-lg shadow-red-500/20 hover:scale-105'
            }`}
          >
            {isSelected ? 'Vorgemerkt' : 'Select for Deletion'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuditPage;