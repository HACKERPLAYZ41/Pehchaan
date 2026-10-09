import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Accordion({ items, multiple = false, showArrow = true }) {
  const [openItems, setOpenItems] = useState([0]); // first item open by default

  const toggleItem = (index) => {
    if (multiple) {
      setOpenItems(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems(prev => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(index);
        return (
          <div 
            key={index} 
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
            }}
          >
            <button
              onClick={() => toggleItem(index)}
              style={{
                width: '100%',
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '15px',
                color: '#0f172a',
                fontFamily: 'var(--font-headline)',
              }}
            >
              <span>{item.title}</span>
              {showArrow && (
                <ChevronDown 
                  className="w-5 h-5 text-slate-400 shrink-0" 
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.25s ease',
                    color: isOpen ? '#2563eb' : '#94a3b8'
                  }} 
                />
              )}
            </button>
            {isOpen && (
              <div style={{
                padding: '0 24px 20px',
                fontSize: '14px',
                color: '#434655',
                lineHeight: 1.65,
                borderTop: '1px solid #f1f5f9',
                paddingTop: '16px',
              }}>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
