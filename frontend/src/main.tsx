import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import AuditPage from './pages/AuditPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  // Zeige nichts an (oder einen Lade-Spinner), während der Auth-Status geprüft wird
  if (loading) {
    return (
      <div className="h-screen bg-[#0b0c10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#e11d48]"></div>
      </div>
    );
  }

  // Wenn keine Session existiert, ab zum Login
  if (!session) {
    return <Navigate to="/portal/login" replace />;
  }

  // Wenn eingeloggt, zeige die geschützte Seite
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- ÖFFENTLICHE ROUTEN (Jeder kann diese sehen) --- */}
        <Route path="/" element={<SearchPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* --- PORTAL ROUTEN (Login & Registrierung) --- */}
        <Route path="/portal/login" element={<LoginPage />} />

        {/* --- GESCHÜTZTE ROUTEN (Nur für eingeloggte Kunden) --- */}
        <Route 
          path="/portal/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* --- FALLBACK (Optional: Unbekannte URLs zum Home leiten) --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;