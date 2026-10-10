import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  Cpu, 
  Globe2, 
  Zap, 
  Radar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';

export function GsapThreatTelemetry({ activeDetectionsCount = 0, isLiveScan = false }) {
  const containerRef = useRef(null);
  const radarBeamRef = useRef(null);
  
  // Counter refs
  const counterScannedRef = useRef(null);
  const counterPrecisionRef = useRef(null);
  const counterLatencyRef = useRef(null);
  const counterQuarantinedRef = useRef(null);

  // Live telemetry metrics state
  const [telemetryMode, setTelemetryMode] = useState('global'); // 'global' | 'workspace'
  const [liveStreamEvents, setLiveStreamEvents] = useState([
    { id: 1, platform: 'BLUESKY', entity: '@lumorabank-support.bsky.social', type: 'Cyrillic Homoglyph Swap', score: 94, time: 'Just now', severity: 'HIGH' },
    { id: 2, platform: 'PLAY STORE', entity: 'com.lumora.mobilebank.fastloan', type: 'Developer Package Mimic', score: 88, time: '2m ago', severity: 'CRITICAL' },
    { id: 3, platform: 'APP STORE', entity: 'Lumora Finance - Easy KYC', type: 'Typo-Squatting / Phishing', score: 76, time: '5m ago', severity: 'MEDIUM' },
    { id: 4, platform: 'DOMAINS', entity: 'lumorabank-verification.in', type: 'Rogue Phishing Portal', score: 91, time: '8m ago', severity: 'HIGH' },
  ]);

  // Target metric values
  const targetMetrics = {
    scanned: telemetryMode === 'global' ? 14820 : Math.max(34, activeDetectionsCount * 12),
    precision: 99.8,
    latency: 18.4,
    quarantined: telemetryMode === 'global' ? 342 : activeDetectionsCount,
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance animation for telemetry cards
      gsap.from('.telemetry-kpi-card', {
        y: 24,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
      });

      // 2. Continuous 360-degree radar beam sweep
      if (radarBeamRef.current) {
        gsap.to(radarBeamRef.current, {
          rotation: 360,
          transformOrigin: '50% 50%',
          repeat: -1,
          duration: 3.5,
          ease: 'none',
        });
      }

      // 3. Pulsing threat beacon blips on radar
      gsap.to('.radar-threat-blip', {
        scale: 1.6,
        opacity: 0.3,
        stagger: 0.4,
        repeat: -1,
        yoyo: true,
        duration: 1.2,
        ease: 'sine.inOut',
      });

      // 4. Smooth GSAP rolling counters
      const counterObj = {
        scanned: 0,
        precision: 0,
        latency: 0,
        quarantined: 0,
      };

      gsap.to(counterObj, {
        scanned: targetMetrics.scanned,
        precision: targetMetrics.precision,
        latency: targetMetrics.latency,
        quarantined: targetMetrics.quarantined,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          if (counterScannedRef.current) {
            counterScannedRef.current.innerText = Math.round(counterObj.scanned).toLocaleString();
          }
          if (counterPrecisionRef.current) {
            counterPrecisionRef.current.innerText = counterObj.precision.toFixed(1) + '%';
          }
          if (counterLatencyRef.current) {
            counterLatencyRef.current.innerText = counterObj.latency.toFixed(1) + 'ms';
          }
          if (counterQuarantinedRef.current) {
            counterQuarantinedRef.current.innerText = Math.round(counterObj.quarantined).toLocaleString();
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [telemetryMode, activeDetectionsCount]);

  // Periodic simulated live telemetry tick to make the SOC dashboard feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      // Subtle pulse on counter
      if (counterScannedRef.current && telemetryMode === 'global') {
        const current = parseInt(counterScannedRef.current.innerText.replace(/,/g, ''), 10) || targetMetrics.scanned;
        const increment = Math.floor(Math.random() * 5) + 1;
        gsap.to(counterScannedRef.current, {
          scale: 1.05,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            if (counterScannedRef.current) {
              counterScannedRef.current.innerText = (current + increment).toLocaleString();
            }
          }
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [telemetryMode]);

  return (
    <div ref={containerRef} style={{ marginBottom: '24px' }}>
      {/* Telemetry Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            position: 'relative',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
          }}>
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              opacity: 0.4,
              animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Live SOC Radar Telemetry</span>
              <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px' }}>GSAP Powered</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Multi-surface intelligence across Bluesky nodes, Google Play index, and App Store catalogs
            </div>
          </div>
        </div>

        {/* Telemetry Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setTelemetryMode('global')}
            style={{
              border: 'none',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: telemetryMode === 'global' ? '#ffffff' : 'transparent',
              color: telemetryMode === 'global' ? '#2563eb' : '#64748b',
              boxShadow: telemetryMode === 'global' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Global Threat Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setTelemetryMode('workspace')}
            style={{
              border: 'none',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: telemetryMode === 'workspace' ? '#ffffff' : 'transparent',
              color: telemetryMode === 'workspace' ? '#2563eb' : '#64748b',
              boxShadow: telemetryMode === 'workspace' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Active Brand Radar</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Telemetry Cards + Radar Visualization */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {/* Left Column: 4 GSAP Animated Telemetry KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {/* Card 1: Scanned Nodes */}
          <div className="telemetry-kpi-card glass-card" style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Nodes Scanned
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div 
              ref={counterScannedRef}
              style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}
            >
              0
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time AT-Protocol & App Crawl</span>
            </div>
          </div>

          {/* Card 2: Precision Accuracy */}
          <div className="telemetry-kpi-card glass-card" style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Precision Rate
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div 
              ref={counterPrecisionRef}
              style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}
            >
              0.0%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              <span>0% False Positive Whitelist</span>
            </div>
          </div>

          {/* Card 3: Engine Latency */}
          <div className="telemetry-kpi-card glass-card" style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Engine Latency
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div 
              ref={counterLatencyRef}
              style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}
            >
              0.0ms
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
              <Clock className="w-3.5 h-3.5" />
              <span>Sub-20ms Damerau-Levenshtein</span>
            </div>
          </div>

          {/* Card 4: Quarantined Threats */}
          <div className="telemetry-kpi-card glass-card" style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Threat Vectors Flagged
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div 
              ref={counterQuarantinedRef}
              style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}
            >
              0
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', marginTop: '6px', fontWeight: 600 }}>
              <span>Actionable Legal Takedowns</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive GSAP Radar Graphic */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#0b1120',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '220px'
        }}>
          {/* Top Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radar className="w-4 h-4 text-cyan-400" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Active Spatial Radar Sweep
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              LIVE SENSORS: 3
            </span>
          </div>

          {/* SVG Radar Visual with GSAP Animated Beam */}
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            margin: '8px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Concentric rings */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.2)' }} />
            <div style={{ position: 'absolute', inset: '28px', borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.3)' }} />
            <div style={{ position: 'absolute', inset: '56px', borderRadius: '50%', border: '1px dashed rgba(56, 189, 248, 0.35)' }} />

            {/* Crosshairs */}
            <div style={{ position: 'absolute', width: '100%', height: '1px', backgroundColor: 'rgba(56, 189, 248, 0.2)' }} />
            <div style={{ position: 'absolute', height: '100%', width: '1px', backgroundColor: 'rgba(56, 189, 248, 0.2)' }} />

            {/* GSAP Sweep Beam */}
            <div
              ref={radarBeamRef}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.45) 0deg, transparent 65deg)',
                pointerEvents: 'none'
              }}
            />

            {/* Animated Threat Blips */}
            <div className="radar-threat-blip" style={{
              position: 'absolute',
              top: '32px',
              right: '48px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 10px #ef4444'
            }} />
            <div className="radar-threat-blip" style={{
              position: 'absolute',
              bottom: '40px',
              left: '36px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 8px #f59e0b'
            }} />
            <div className="radar-threat-blip" style={{
              position: 'absolute',
              top: '60px',
              left: '52px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#06b6d4',
              boxShadow: '0 0 6px #06b6d4'
            }} />

            {/* Center Core */}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 12px #38bdf8',
              zIndex: 3
            }} />
          </div>

          {/* Bottom Grid Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94a3b8',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '8px',
            zIndex: 2
          }}>
            <span>Coverage: Bluesky · Play Store · App Store</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Active Polling</span>
          </div>
        </div>
      </div>

      {/* Live Global Threat Feed Ticker */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Real-Time Sensor Feed & Signature Ingestion</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Autonomous threat stream
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {liveStreamEvents.map(evt => (
            <div 
              key={evt.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                fontSize: '12px',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                <span className={`badge ${evt.platform === 'BLUESKY' ? 'badge-info' : evt.platform === 'PLAY STORE' ? 'badge-warning' : 'badge-threat'}`} style={{ fontSize: '10px' }}>
                  {evt.platform}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>
                  {evt.entity}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '11px' }}>
                  {evt.type}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: evt.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                    color: evt.severity === 'CRITICAL' ? '#b91c1c' : '#b45309'
                  }}>
                    {evt.score}% MATCH
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {evt.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
