import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import AuditPage from './pages/AuditPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-[#0b0c10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#e11d48]"></div>
      </div>
    );
  }
  
  if (!session) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
};

function App() {
  // DAS RETURN HAT GEFEHLT - JETZT KORRIGIERT
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        
        {/* Absolute Pfade für Vercel-Stabilität */}
        <Route path="/portal/login" element={<LoginPage />} />
        <Route 
          path="/portal/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route path="/audit" element={<AuditPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;