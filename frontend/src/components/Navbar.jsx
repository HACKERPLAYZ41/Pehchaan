import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Menu,
  X,
  Info,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  FileText,
  CheckCheck,
  Radio,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";

const initialAlerts = [
  {
    id: 1,
    title: "High-risk handle impersonation",
    source: "Bluesky Social",
    body: "lumora-bank-support.bsky.social is 91% similar to your brand profile.",
    time: "2m ago",
    severity: "critical",
    target: "triage",
    unread: true,
  },
  {
    id: 2,
    title: "Counterfeit app clone detected",
    source: "Google Play Store",
    body: "com.lumora.bank.mobile mimicking official logo & metadata hash.",
    time: "15m ago",
    severity: "high",
    target: "scans",
    unread: true,
  },
  {
    id: 3,
    title: "India DPDP Act 2023 compliance",
    source: "Retention Policy",
    body: "Automated purge scheduled in 7 days. Zero persistent personal data stored.",
    time: "1h ago",
    severity: "info",
    target: "privacy",
    unread: true,
  },
  {
    id: 4,
    title: "Abuse takedown draft ready",
    source: "Legal Intelligence",
    body: "Case #DET-101 takedown notice generated and ready for submission.",
    time: "3h ago",
    severity: "success",
    target: "triage",
    unread: false,
  },
];

export function Navbar({ onNavigate, onLoadSample, onTrySample, currentView = "landing" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);

  const bellRef = useRef(null);
  const unreadCount = alerts.filter((a) => a.unread).length;

  const handleAction = () => {
    if (onTrySample) onTrySample();
    else if (onLoadSample) onLoadSample();
    else if (onNavigate) onNavigate("dashboard");
  };

  const handleNavClick = (view, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.location.href = view === "landing" ? "/" : `/${view}`;
    }
  };

  // Close popovers on click outside and escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        setInfoModalOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu or info modal is open
  useEffect(() => {
    if (mobileMenuOpen || infoModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, infoModalOpen]);

  const markAllRead = () => {
    setAlerts((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markSingleRead = (id, target) => {
    setAlerts((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    setBellOpen(false);
    if (target && onNavigate) {
      onNavigate(target);
    }
  };

  const navLinks = [
    { label: "Product", view: "landing", hash: "#product" },
    { label: "Threat Engine", view: "dashboard" },
    { label: "Live Triage", view: "triage" },
    { label: "Privacy & DPDP", view: "privacy" },
    { label: "Terms", view: "terms" },
  ];

  return (
    <>
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0b1329]/95 text-slate-100 backdrop-blur-xl shadow-xl shadow-slate-950/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand & Radar Status */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => handleNavClick("landing", e)}
              className="group flex items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded-lg p-1 transition-transform active:scale-95"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/30 to-indigo-900/40 p-1 shadow-lg shadow-blue-500/20 group-hover:border-blue-400">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Pehchaan Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <Shield className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline text-lg font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                    Pehchaan
                  </span>
                  <span className="hidden font-mono text-[11px] font-medium text-slate-400 sm:inline-block">
                    (पहचान)
                  </span>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                    DRP SOC
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    Radar Active
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav aria-label="Main Navigation" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={(e) => handleNavClick(link.view, e)}
                  className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions, Telemetry Alerts & Platform Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Info / About Button */}
            <button
              type="button"
              onClick={() => setInfoModalOpen(true)}
              aria-label="Platform information and compliance"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-blue-500/50 hover:bg-slate-700/70 hover:text-blue-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              title="About Pehchaan DRP"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen((prev) => !prev)}
                aria-label={`Threat alerts: ${unreadCount} unread`}
                aria-expanded={bellOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-blue-500/50 hover:bg-slate-700/70 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-md shadow-rose-600/40">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {bellOpen && (
                <div className="absolute right-0 top-12 z-[100] w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] overflow-hidden rounded-2xl border border-slate-700/90 bg-[#0d162d]/98 text-slate-100 shadow-2xl shadow-black/70 backdrop-blur-2xl">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-blue-400" />
                      <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-200">
                        Threat Telemetry Alerts
                      </h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 text-[10px] font-medium text-rose-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Popover Body List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {alerts.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No active threat alerts in radar.
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const isCritical = alert.severity === "critical";
                        const isHigh = alert.severity === "high";
                        const isSuccess = alert.severity === "success";

                        return (
                          <div
                            key={alert.id}
                            onClick={() => markSingleRead(alert.id, alert.target)}
                            className={`group cursor-pointer rounded-xl p-3 transition-colors ${
                              alert.unread
                                ? "bg-slate-800/40 hover:bg-slate-800/80"
                                : "opacity-75 hover:opacity-100 hover:bg-slate-800/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Severity Icon */}
                              <div
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                                  isCritical
                                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                    : isHigh
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                    : isSuccess
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {isCritical && <ShieldAlert className="h-4 w-4" />}
                                {isHigh && <Smartphone className="h-4 w-4" />}
                                {isSuccess && <FileText className="h-4 w-4" />}
                                {!isCritical && !isHigh && !isSuccess && (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </div>

                              {/* Alert Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                                    {alert.source}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                                    {alert.time}
                                  </span>
                                </div>
                                <h4 className="mt-0.5 truncate text-xs font-bold text-white group-hover:text-blue-300">
                                  {alert.title}
                                </h4>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">
                                  {alert.body}
                                </p>
                              </div>

                              {/* Unread dot */}
                              {alert.unread && (
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2.5">
                    <span className="font-mono text-[10px] text-slate-400">
                      Live Telemetry Stream
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBellOpen(false);
                        if (onNavigate) onNavigate("dashboard");
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <span>Open SOC Desk</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CTA: Try Sample Brand */}
            <button
              type="button"
              onClick={handleAction}
              className="relative hidden sm:inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-98"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              <span>Try Sample Brand</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:bg-slate-700/70 hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Accordion Panel */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile Navigation" className="border-t border-slate-800 bg-[#0d162d] px-4 pt-3 pb-6 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={(e) => handleNavClick(link.view, e)}
                  className="flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/70 hover:text-white"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAction();
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
              >
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span>Try Sample Brand (Lumora Bank)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setInfoModalOpen(true);
                }}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                <Info className="h-4 w-4 text-blue-400" />
                <span>About Pehchaan Architecture</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Info / About Modal ("i" button modal) */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setInfoModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/90 bg-[#0f172a] text-slate-100 shadow-2xl shadow-black/80">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-600/20 shadow-md shadow-blue-500/20">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Pehchaan Logo"
                    className="h-7 w-7 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-white">
                    About Pehchaan DRP
                  </h3>
                  <p className="text-xs text-slate-400">
                    Digital Risk & Impersonation Protection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 px-6 py-5 text-xs text-slate-300">
              <p className="leading-relaxed">
                <strong className="text-white">Pehchaan (पहचान)</strong> is an enterprise-grade
                Digital Risk Protection (DRP) prototype built to safeguard brands against online
                impersonation, malicious app counterfeiting, and typosquatting scams.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="font-semibold text-blue-400 block mb-1">
                    Multi-Vector Radar
                  </span>
                  <span>
                    Continuous scanning across Bluesky Social, Google Play Store, and iOS App Store.
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    India DPDP Act 2023
                  </span>
                  <span>
                    Strict data minimisation: automated 7-day purging & one-click workspace shredding.
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="font-semibold text-amber-400 block mb-1">
                    Homoglyph & dHash AI
                  </span>
                  <span>
                    Detection of visually identical character swaps and perceptual logo counterfeits.
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="font-semibold text-indigo-400 block mb-1">
                    Instant Takedown Kit
                  </span>
                  <span>
                    Pre-filled legal abuse notices generated for platform terms & conditions enforcement.
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-[11px] text-blue-200">
                💡 <strong>Demo Mode:</strong> Click "Try Sample Brand" to load <em>Lumora Bank</em> and
                simulate real-time threats and takedown workflows.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/60 px-6 py-3">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInfoModalOpen(false);
                  handleAction();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500"
              >
                Try Sample Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;