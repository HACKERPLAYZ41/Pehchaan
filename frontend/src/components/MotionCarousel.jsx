import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert, Sparkles, Smartphone, Search, Layers } from 'lucide-react';

export function MotionCarousel({ items, autoPlay = true, intervalMs = 4000 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoPlay, intervalMs, items.length]);

  const handleNext = () => setActiveIndex((activeIndex + 1) % items.length);
  const handlePrev = () => setActiveIndex((activeIndex - 1 + items.length) % items.length);

  if (!items || items.length === 0) return null;

  const activeItem = items[activeIndex];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div className="glass-card" style={{
        padding: '28px',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        transition: 'all 0.3s ease',
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${activeItem.badgeType || 'badge-info'}`}>
                {activeItem.badgeText || 'FEATURE HIGHLIGHT'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Signal Vector #{activeIndex + 1} of {items.length}
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-500" style={{ color: '#d97706' }} />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            {activeItem.title}
          </h3>

          <p style={{ fontSize: '14px', color: '#434655', lineHeight: 1.6 }}>
            {activeItem.description}
          </p>
        </div>

        {/* Dots & Nav Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                style={{
                  width: i === activeIndex ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === activeIndex ? '#2563eb' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handlePrev}
              className="btn btn-secondary" 
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              className="btn btn-secondary" 
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
