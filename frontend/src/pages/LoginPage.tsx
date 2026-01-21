import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Hintergrund-Effekt */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Zurück zur Website
      </Link>

      <div className="w-full max-w-md z-10">
        {/* Logo-Sektion */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="bg-[#e11d48] p-4 rounded-3xl shadow-2xl shadow-red-500/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
            OMNICORE <span className="text-[#e11d48]">PORTAL</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">
            Client Access Control
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#e11d48',
                    brandAccent: '#fb7185',
                    inputText: 'white',
                    inputBackground: 'rgba(15, 23, 42, 0.5)',
                    inputBorder: 'rgba(255, 255, 255, 0.1)',
                    inputBorderFocus: '#e11d48',
                  },
                  radii: {
                    borderRadiusButton: '1rem',
                    buttonPadding: '12px',
                    inputPadding: '12px',
                  }
                },
              },
            }}
            theme="dark"
            providers={[]} // Hier kannst du später 'google' hinzufügen
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-Mail Adresse',
                  password_label: 'Passwort',
                  button_label: 'Anmelden',
                  loading_button_label: 'Wird angemeldet...',
                  link_text: 'Bereits ein Konto? Anmelden',
                },
                sign_up: {
                  email_label: 'E-Mail Adresse',
                  password_label: 'Passwort erstellen',
                  button_label: 'Konto erstellen',
                  link_text: 'Neu hier? Konto erstellen',
                }
              },
            }}
          />
        </div>

        {/* Support Note */}
        <p className="mt-8 text-center text-slate-600 text-xs font-medium uppercase tracking-widest leading-relaxed">
          Probleme beim Login? <br />
          <span className="text-slate-400">support@omnicore-systeme.de</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;