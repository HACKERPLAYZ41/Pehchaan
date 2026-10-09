import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BrandProfilePage } from './pages/BrandProfilePage';
import { ScanResultsPage } from './pages/ScanResultsPage';
import { TriagePage } from './pages/TriagePage';
import { SignInPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages';
import { PrivacyPolicyPage, TermsPage, CookiePolicyPage, HealthPage, NotFoundPage } from './pages/LegalPages';
import { ConsentNotice } from './components/ConsentNotice';
import { AlertDialog } from './components/AlertDialog';
import { api } from './services/api';

// Map path to view string
const getViewFromPath = (path) => {
  const p = path.replace(/^\//, '').toLowerCase();
  if (!p || p === '') return 'landing';
  if (['landing', 'signin', 'register', 'reset-password', 'dashboard', 'brand', 'scans', 'triage', 'privacy', 'terms', 'cookies', 'health', '404'].includes(p)) {
    return p;
  }
  return '404';
};

export default function App() {
  const [currentView, setCurrentView] = useState(() => getViewFromPath(window.location.pathname));
  const [brand, setBrand] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Sync state on browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch initial brand profile
  useEffect(() => {
    api.getBrand()
      .then(res => {
        if (res.brand_profile) {
          setBrand(res.brand_profile);
        }
      })
      .catch(console.error);
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
    const newPath = view === 'landing' ? '/' : `/${view}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSample = async () => {
    try {
      const res = await api.loadSampleBrand();
      if (res.brand_profile) {
        setBrand(res.brand_profile);
        handleNavigate('dashboard');
      }
    } catch (err) {
      alert(`Error loading sample brand: ${err.message}`);
    }
  };

  const handleConfirmResetWorkspace = async () => {
    try {
      await api.deleteWorkspace();
      setBrand(null);
      alert("Workspace telemetry and brand data permanently deleted.");
      handleNavigate('landing');
    } catch (err) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} onLoadSample={handleLoadSample} />;
      case 'signin':
        return <SignInPage onNavigate={handleNavigate} onLoadSample={handleLoadSample} setBrand={setBrand} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} onLoadSample={handleLoadSample} setBrand={setBrand} />;
      case 'reset-password':
        return <ResetPasswordPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return (
          <DashboardPage 
            onNavigate={handleNavigate} 
            brand={brand} 
            setBrand={setBrand} 
            onLoadSample={handleLoadSample}
            onResetWorkspace={() => setDeleteDialog(true)}
          />
        );
      case 'brand':
        return (
          <BrandProfilePage 
            onNavigate={handleNavigate} 
            brand={brand} 
            setBrand={setBrand} 
            onLoadSample={handleLoadSample}
            onResetWorkspace={() => setDeleteDialog(true)}
          />
        );
      case 'scans':
        return (
          <ScanResultsPage 
            onNavigate={handleNavigate} 
            brand={brand} 
            onLoadSample={handleLoadSample}
            onResetWorkspace={() => setDeleteDialog(true)}
          />
        );
      case 'triage':
        return (
          <TriagePage 
            onNavigate={handleNavigate} 
            brand={brand} 
            onLoadSample={handleLoadSample}
            onResetWorkspace={() => setDeleteDialog(true)}
          />
        );
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} onResetWorkspace={() => setDeleteDialog(true)} />;
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} />;
      case 'cookies':
        return <CookiePolicyPage onNavigate={handleNavigate} />;
      case 'health':
        return <HealthPage onNavigate={handleNavigate} />;
      case '404':
        return <NotFoundPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} onLoadSample={handleLoadSample} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
      
      <ConsentNotice onNavigate={handleNavigate} />

      {/* AlertDialog for DPDP Right to Erasure */}
      <AlertDialog 
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleConfirmResetWorkspace}
        title="Execute Right to Erasure?"
        description="Under DPDP Act 2023 provisions, this will permanently delete all workspace telemetry, brand specs, and session cookies from the database."
        confirmLabel="Permanent Delete"
        cancelLabel="Keep Workspace"
        variant="danger"
      />
    </div>
  );
}
