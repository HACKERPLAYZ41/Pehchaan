import React from 'react';
import { 
  Shield, 
  ShieldCheck,
  Search, 
  Smartphone, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  FileText, 
  ShieldAlert, 
  Play,
  Layers
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Accordion } from '../components/Accordion';
import { MotionCarousel } from '../components/MotionCarousel';

export function LandingPage({ onNavigate, onLoadSample }) {
  const faqItems = [
    {
      title: "Does Pehchaan remove fake profiles for me?",
      content: "No. Pehchaan is an intelligence and detection platform. We surface fake profiles, scam accounts, and clone apps with similarity scores and evidence. Your security team uses our pre-filled takedown drafts to submit requests to the respective platforms."
    },
    {
      title: "Which platforms are monitored?",
      content: "Currently, Pehchaan monitors Bluesky Social (via real-time search API), Google Play Store, and Apple App Store. Additional social connectors can be enabled."
    },
    {
      title: "How does Pehchaan comply with DPDP Act 2023?",
      content: "Pehchaan implements strict data minimisation: we store no personal user data beyond hashed IPs. All workspace scan data is automatically purged after 7 days. You can also trigger immediate deletion via the 'Delete My Workspace' button."
    },
    {
      title: "What is Lookalike Name Detection?",
      content: "Lookalike detection catches trick handles that look visually identical to your brand name using character replacements (e.g., replacing 'o' with 0, 'l' with 1, or homoglyph characters) and keyword additions like 'support' or 'official'."
    },
    {
      title: "How do I test the app right now?",
      content: "Click 'Try Live Demo' or 'Open App' above to automatically load a pre-configured Brand Profile (Lumora Bank) and run instant scans across social & app stores."
    }
  ];

  const carouselItems = [
    {
      title: "Bluesky Social Handle Impersonation",
      description: "Flagged handle 'lumora-bank-support.bsky.social' using homoglyph swaps + fake customer care hotline in bio. 91% similarity match.",
      badgeText: "BLUESKY THREAT",
      badgeType: "badge-threat"
    },
    {
      title: "Google Play Malicious App Clone",
      description: "Flagged unauthorized package 'Lumora Mobile - Quick Loans' mimicking developer identity and logo dHash. 86% similarity score.",
      badgeText: "PLAY STORE THREAT",
      badgeType: "badge-threat"
    },
    {
      title: "Apple App Store Typosquatting",
      description: "Detected iOS app 'Lumora Finance Rewards' attempting character injection to bypass basic regex filters. 74% match score.",
      badgeText: "APP STORE THREAT",
      badgeType: "badge-warning"
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)', minHeight: '100vh' }}>
      <Navbar onNavigate={onNavigate} currentView="landing" onLoadSample={onLoadSample} />

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '48px',
        alignItems: 'center',
      }}>
        <div>
          {/* Compliance Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid var(--surface-dim)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--primary-dark)',
            marginBottom: '20px',
          }}>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>DPDP Act 2023 Compliant · Built for Indian Brands</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--secondary-dark)',
            marginBottom: '20px',
          }}>
            Stop Brand Impersonators Before They Reach Your Customers
          </h1>

          <p style={{
            fontSize: '18px',
            color: 'var(--on-surface-variant)',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}>
            Pehchaan scans Bluesky, Google Play, and Apple App Store in real-time to detect fake profiles, scam accounts, and fraudulent mobile apps impersonating your organization.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button 
              onClick={() => onNavigate('register')}
              className="btn btn-primary" 
              style={{ padding: '14px 28px', fontSize: '16px' }}
            >
              <span>Start Free Detection</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onLoadSample}
              className="btn btn-secondary" 
              style={{ padding: '14px 24px', fontSize: '16px' }}
            >
              <Sparkles className="w-5 h-5 text-amber-500" style={{ color: '#d97706' }} />
              <span>Try Live Demo</span>
            </button>
          </div>

          {/* Micro trust indicators */}
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--secondary)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" style={{ color: '#16a34a' }} />
              <span>No credit card required</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" style={{ color: '#16a34a' }} />
              <span>7-Day Data Retention (DPDP)</span>
            </span>
          </div>
        </div>

        {/* Hero Visual Motion Carousel */}
        <div>
          <MotionCarousel items={carouselItems} autoPlay={true} intervalMs={4000} />
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ backgroundColor: '#eff4ff', borderTop: '1px solid #dce9ff', borderBottom: '1px solid #dce9ff', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#004ac6', fontFamily: 'var(--font-headline)' }}>12,400+</div>
            <div style={{ fontSize: '14px', color: '#434655' }}>Threats Detected</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#004ac6', fontFamily: 'var(--font-headline)' }}>98.3%</div>
            <div style={{ fontSize: '14px', color: '#434655' }}>Detection Precision</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#004ac6', fontFamily: 'var(--font-headline)' }}>3 Platforms</div>
            <div style={{ fontSize: '14px', color: '#434655' }}>Bluesky, Play Store, App Store</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#004ac6', fontFamily: 'var(--font-headline)' }}>7 Days</div>
            <div style={{ fontSize: '14px', color: '#434655' }}>DPDP Auto-Purge TTL</div>
          </div>
        </div>
      </section>

      {/* Detection vs Protection Explainer */}
      <section style={{ maxWidth: '1280px', margin: '60px auto 0', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#eff4ff',
          borderLeft: '4px solid #2563eb',
          borderRadius: '8px',
          padding: '24px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <ShieldAlert className="w-6 h-6 text-blue-600" style={{ color: '#2563eb' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              What Pehchaan Does (and Doesn't Do)
            </h3>
          </div>
          <p style={{ fontSize: '15px', color: '#434655', lineHeight: 1.6 }}>
            Pehchaan is a <strong>detection and intelligence platform</strong>. We surface threats — fake profiles, impersonating apps, fraudulent pages — with similarity scores and evidence. Your security team then acts: filing takedown requests with the platform, reporting to app stores, or escalating to legal. We give you the intelligence; you own the response.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Three Threat Vectors. One Platform.
          </h2>
          <p style={{ fontSize: '16px', color: '#434655', maxWidth: '640px', margin: '0 auto' }}>
            Our algorithmic engine continuously searches social networks and mobile app stores to identify lookalike profiles and malicious visual clones.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div className="glass-card glass-card-interactive" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#2563eb' }}>
              <Search className="w-6 h-6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Social Media Monitoring</h3>
            <p style={{ fontSize: '14px', color: '#434655', lineHeight: 1.6, marginBottom: '20px' }}>
              Detect fake profiles, impersonating pages, and scam accounts on Bluesky and social channels. Normaliser engine catches homoglyph swaps (rn → m) and leetspeak (3 → e).
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-info">Real-time</span>
              <span className="badge badge-info">Bluesky API</span>
            </div>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#2563eb' }}>
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>App Store Monitoring</h3>
            <p style={{ fontSize: '14px', color: '#434655', lineHeight: 1.6, marginBottom: '20px' }}>
              Scan Google Play and Apple App Store for unauthorized apps mimicking your brand's name, developer identity, or logo. Image hash comparison flags visual clones even when names differ.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-info">Google Play</span>
              <span className="badge badge-info">Apple Store</span>
            </div>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#2563eb' }}>
              <Layers className="w-6 h-6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Lookalike Name Engine</h3>
            <p style={{ fontSize: '14px', color: '#434655', lineHeight: 1.6, marginBottom: '20px' }}>
              Multi-layer detection combining Levenshtein distance, Jaccard token analysis, and homoglyph normalization. We find what human eyes miss — before your customers are deceived.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-info">Homoglyphs</span>
              <span className="badge badge-info">Typosquatting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Placeholders */}
      <section style={{ padding: '60px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Customer Reviews & Feedback</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              (Notice per launch guidelines: Real client reviews will be pasted after official deployment)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[1, 2, 3].map((num) => (
              <div key={num} style={{ padding: '24px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', marginBottom: '16px' }}>
                  "[Placeholder Review: Customer feedback on Pehchaan's digital risk protection accuracy will be inserted here upon verified user consent]"
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  — [Customer Name {num}], CIS/SOC Lead
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '40px' }}>
          Frequently Asked Questions
        </h2>

        <Accordion items={faqItems} multiple={false} showArrow={true} />
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
