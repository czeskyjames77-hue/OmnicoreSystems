import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Shield, Clock, CheckCircle, ExternalLink, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

// Definition des Audit-Typs für volle TypeScript-Unterstützung
interface Audit {
  id: string;
  company_name: string;
  address: string;
  data_id: string;
  user_id: string;
  cleanup_status?: {
    current_status: string;
  }[];
}

const DashboardPage = () => {
  const { user } = useAuth();
  // Hier nutzen wir das Interface für den State
  const [activeAudits, setActiveAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDashboard = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          cleanup_status (*)
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        setActiveAudits(data as Audit[]);
      }
      setLoading(false);
    };

    fetchUserDashboard();
  }, [user]);

  const handleLogout = () => supabase.auth.signOut();

  if (loading) return (
    <div className="h-screen bg-[#0b0c10] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#e11d48]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex">
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 justify-between">
        <div className="bg-[#e11d48] p-3 rounded-xl shadow-lg shadow-red-500/20">
          <Shield size={24} />
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors">
          <LogOut size={24} />
        </button>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <p className="text-[#e11d48] font-black uppercase tracking-[0.3em] text-[10px] mb-2">Omnicore Client Portal</p>
            <h1 className="text-4xl font-black tracking-tighter">Willkommen, {user?.email?.split('@')[0]}</h1>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">System Status</p>
            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 justify-end">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Alle Systeme operativ
            </p>
          </div>
        </header>

        {activeAudits.length === 0 ? (
          <div className="bg-slate-900/20 border border-white/5 p-20 rounded-[3rem] text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Noch keine aktiven Löschaufträge gefunden.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {activeAudits.map((audit) => (
              <motion.div 
                key={audit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8"
              >
                <div>
                  <h3 className="text-2xl font-black mb-2">{audit.company_name}</h3>
                  <p className="text-slate-500 text-sm font-medium mb-4">{audit.address}</p>
                  <span className="bg-slate-800 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                    ID: {audit.data_id?.substring(0, 8)}
                  </span>
                </div>

                <div className="flex-1 max-w-md w-full">
                   <div className="flex justify-between mb-4">
                      <StatusStep label="Analyse" active={true} />
                      <StatusStep label="Einreichung" active={audit.cleanup_status?.[0]?.current_status !== 'In Prüfung'} />
                      <StatusStep label="Bereinigt" active={audit.cleanup_status?.[0]?.current_status === 'Gelöscht'} />
                   </div>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#e11d48] transition-all duration-1000" 
                        style={{ 
                          width: audit.cleanup_status?.[0]?.current_status === 'Gelöscht' ? '100%' : 
                                 audit.cleanup_status?.[0]?.current_status === 'Eingereicht' ? '66%' : '33%' 
                        }}
                      />
                   </div>
                </div>

                <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all">
                  <ExternalLink size={20} className="text-slate-400" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const StatusStep = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`flex flex-col items-center gap-2 ${active ? 'text-white' : 'text-slate-600'}`}>
    {active ? <CheckCircle size={16} className="text-[#e11d48]" /> : <Clock size={16} />}
    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
  </div>
);

export default DashboardPage;