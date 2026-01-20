import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, Trash2, CheckCircle, Lock, CreditCard, 
  Wallet, Smartphone, Info, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Daten aus der AuditPage empfangen
  const state = location.state as { selectedReviews: any[], company: any };
  
  if (!state || !state.selectedReviews) {
    // Sicherheits-Check: Ohne Auswahl zurück zur Suche
    React.useEffect(() => { navigate('/'); }, [navigate]);
    return null;
  }

  const { selectedReviews, company } = state;

  // Formular-States
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    address: '', zip: '', city: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'mobile'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamische Preisberechnung
  const pricing = useMemo(() => {
    const unitPrice = 19.90; // Dein Preis pro Löschung
    const count = selectedReviews.length;
    const total = count * unitPrice;
    return { count, unitPrice, total: total.toFixed(2) };
  }, [selectedReviews]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // API-Call an dein Backend für die Stripe-Session
      const response = await api.post('/api/create-checkout-session', {
        reviews: selectedReviews,
        company: company,
        customerDetails: formData
      });

      if (response.data.url) {
        // Weiterleitung zu Stripe
        window.location.href = response.data.url;
      } else {
        alert("Fehler beim Erstellen der Zahlungssitzung.");
      }
    } catch (err) {
      console.error("Omnicore Checkout Error:", err);
      alert("Zahlung aktuell nicht möglich. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex flex-col">
      {/* Header */}
      <header className="px-12 py-8 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#0b0c10]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#e11d48] p-1.5 rounded-lg shadow-lg shadow-red-500/20">
            <Shield size={20} />
          </div>
          <span className="font-black text-lg tracking-tighter uppercase">OMNICORE</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
            <Lock size={14} /> Sicherer SSL-Checkout
          </div>
          <button 
            onClick={() => navigate('/audit', { state: { company } })}
            className="text-slate-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
          >
            Abbrechen
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-20">
        
        {/* Left Column: Summary */}
        <div className="lg:col-span-5 space-y-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">Bereinigungs-Auftrag</h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Vollständige Entfernung von {pricing.count} identifizierten Rechtsverstößen für 
              <span className="text-white"> {company.name}</span>.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Bestellübersicht</h3>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <Trash2 className="text-[#e11d48]" size={20} />
                  <div>
                    <p className="font-bold text-lg">{pricing.count} Löschanträge</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Garantierte Bearbeitung</p>
                  </div>
                </div>
                <span className="font-black text-xl">{pricing.total} €</span>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Gesamtbetrag</p>
                <p className="text-5xl font-black italic">{pricing.total} €</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                <p className="text-xs font-bold mt-1 text-emerald-500">Sofort verfügbar</p>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] flex gap-6 items-center">
            <CheckCircle size={32} className="text-[#e11d48] shrink-0" />
            <div>
              <h4 className="font-black text-[11px] uppercase tracking-widest text-[#e11d48] mb-1 italic">Success Guarantee</h4>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Falls eine Löschung durch Google abgelehnt wird, erhalten Sie eine 100% Gutschrift. Kein finanzielles Risiko.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/60 border border-white/10 p-12 rounded-[3rem] shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-black mb-12 flex items-center gap-4 uppercase italic">
              <CreditCard className="text-[#e11d48]" /> Rechnungsdetails
            </h2>

            <form onSubmit={handlePayment} className="space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vorname</label>
                  <input required name="firstName" onChange={handleInputChange} type="text" className="w-full bg-slate-950 border border-white/5 p-4 rounded-xl focus:border-red-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nachname</label>
                  <input required name="lastName" onChange={handleInputChange} type="text" className="w-full bg-slate-950 border border-white/5 p-4 rounded-xl focus:border-red-500/50 outline-none transition-all" />
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Mail für Bestätigung</label>
                  <input required name="email" onChange={handleInputChange} type="email" className="w-full bg-slate-950 border border-white/5 p-4 rounded-xl focus:border-red-500/50 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Zahlungsmethode</h3>
                <div className="grid grid-cols-3 gap-4">
                  <PaymentOption active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} icon={<CreditCard size={18} />} label="Karte" />
                  <PaymentOption active={paymentMethod === 'paypal'} onClick={() => setPaymentMethod('paypal')} icon={<Wallet size={18} />} label="PayPal" />
                  <PaymentOption active={paymentMethod === 'mobile'} onClick={() => setPaymentMethod('mobile')} icon={<Smartphone size={18} />} label="Mobile" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#e11d48] py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-red-600 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isProcessing ? "Verarbeite..." : <>Bereinigung jetzt beauftragen <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

const PaymentOption = ({ active, icon, label, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all ${active ? 'bg-red-500/10 border-[#e11d48]' : 'bg-slate-950 border-white/5 text-slate-500'}`}
  >
    <div className={`mb-3 ${active ? 'text-[#e11d48]' : ''}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default CheckoutPage;