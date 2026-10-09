import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Home,
  Package,
  Activity,
  Mail,
  Sparkles,
  LogIn,
  Monitor,
  Smartphone,
  Lock,
  FileText,
  Bell,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { NotchNav } from '@/components/ui/adaptive-notch-navigation-bar';
import { NotificationList } from './NotificationList';

const NOTCH_ITEMS = [
  { id: 'landing', label: 'Overview', icon: Home },
  { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard, badge: 'Live' },
  { id: 'privacy', label: 'DPDP Privacy', icon: Lock },
  { id: 'terms', label: 'Terms & Legal', icon: FileText },
];

const DOCK_ITEMS = [
  { id: 'landing', title: 'Home', icon: Home },
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'sample', title: 'Load Demo', icon: Sparkles },
  { id: 'signin', title: 'Sign In', icon: LogIn },
  { id: 'privacy', title: 'Privacy', icon: Lock },
];

export function DualDeviceNavigation({ onNavigate, currentView, onLoadSample }) {
  // 'auto' = real breakpoint, 'mobile' = force mobile dock UI, 'desktop' = force notch UI
  const [devicePreviewMode, setDevicePreviewMode] = useState('auto');

  const LogoSlot = (
    <div
      onClick={() => onNavigate('landing')}
      className="flex items-center gap-2 cursor-pointer h-8.5 select-none"
    >
      <div className="flex size-7.5 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <Shield className="size-4" />
      </div>
      <span className="font-extrabold text-sm tracking-tight text-zinc-950 dark:text-zinc-50">
        Pehchaan
      </span>
    </div>
  );

  const RightContentSlot = (
    <div className="flex items-center gap-2 h-8.5">
      <NotificationList onNavigate={onNavigate} />

      <button
        onClick={onLoadSample}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
        title="Load Lumora Bank Demo Profile"
      >
        <Sparkles className="size-3.5 text-amber-500" />
        <span className="hidden sm:inline">Demo</span>
      </button>

      <button
        onClick={() => onNavigate('signin')}
        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-zinc-200 bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
      >
        <LogIn className="size-3.5" />
        <span>Sign In</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Device Mode Toggle Controller Bar */}
      <div className="bg-slate-900 text-slate-200 py-1.5 px-4 text-xs flex items-center justify-between border-b border-slate-800 z-[100] relative">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Navigation UI Mode:</span>
          <div className="inline-flex rounded-md bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setDevicePreviewMode('auto')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                devicePreviewMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto (Responsive)
            </button>
            <button
              onClick={() => setDevicePreviewMode('desktop')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                devicePreviewMode === 'desktop'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="size-3" />
              Desktop Notch UI
            </button>
            <button
              onClick={() => setDevicePreviewMode('mobile')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                devicePreviewMode === 'mobile'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="size-3" />
              Mobile Dock UI
            </button>
          </div>
        </div>

        <span className="hidden md:inline text-[11px] text-slate-400 italic">
          Desktop shows Adaptive Notch Bar &bull; Mobile shows Apple Magnification Dock
        </span>
      </div>

      {/* 1. DESKTOP UI: Adaptive Notch Navigation Bar */}
      {(devicePreviewMode === 'desktop' || devicePreviewMode === 'auto') && (
        <div className={devicePreviewMode === 'auto' ? 'hidden lg:block' : 'block'}>
          <NotchNav
            items={NOTCH_ITEMS}
            activeId={currentView}
            position="top"
            logo={LogoSlot}
            rightContent={RightContentSlot}
            showLogo={true}
            showRightContent={true}
            onActiveChange={(id) => onNavigate(id)}
            containerMode={false}
          />
        </div>
      )}

      {/* 2. MOBILE UI: Floating Apple Magnified Dock */}
      {(devicePreviewMode === 'mobile' || devicePreviewMode === 'auto') && (
        <div className={devicePreviewMode === 'auto' ? 'block lg:hidden' : 'block'}>
          {/* Mobile Top Header */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Shield className="size-4" />
              </div>
              <span className="font-bold text-white text-base">Pehchaan</span>
            </div>

            <div className="flex items-center gap-2">
              <NotificationList onNavigate={onNavigate} />
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-full shadow"
              >
                App
              </button>
            </div>
          </div>

          {/* Bottom Floating Apple-style Magnified Dock */}
          <div className="fixed bottom-3 left-0 right-0 z-50 pointer-events-none flex justify-center">
            <div className="pointer-events-auto">
              <Dock className="items-end pb-2 bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
                {DOCK_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <DockItem
                      key={item.id}
                      className={`aspect-square rounded-2xl transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => {
                        if (item.id === 'sample') {
                          onLoadSample();
                        } else {
                          onNavigate(item.id);
                        }
                      }}
                    >
                      <DockLabel>{item.title}</DockLabel>
                      <DockIcon>
                        <Icon className="size-5" />
                      </DockIcon>
                    </DockItem>
                  );
                })}
              </Dock>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
