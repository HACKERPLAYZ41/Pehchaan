import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  X,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  FileText,
  Shield,
  CheckCheck,
} from "lucide-react";

const links = [
  { label: "Product", href: "/#product", view: "landing" },
  { label: "How it works", href: "/#how-it-works", view: "landing" },
  { label: "Privacy", href: "/privacy", view: "privacy" },
  { label: "Terms", href: "/terms", view: "terms" },
];

const sampleAlerts = [
  {
    id: 1,
    title: "High-risk profile found",
    body: "Bluesky account lumora-bank-support.bsky.social is 91% similar to your brand.",
    time: "2 min ago",
    type: "threat",
    target: "triage",
    unread: true,
  },
  {
    id: 2,
    title: "Possible fake app found",
    body: "Google Play package com.lumora.bank.mobile appears to copy your logo.",
    time: "15 min ago",
    type: "app",
    target: "scans",
    unread: true,
  },
  {
    id: 3,
    title: "Auto-delete scheduled",
    body: "Workspace data will be deleted after 7 days, as per India DPDP Act retention policy.",
    time: "1 hour ago",
    type: "dpdp",
    target: "privacy",
    unread: true,
  },
  {
    id: 4,
    title: "Takedown notice ready",
    body: "A takedown notice for case #det_101 is ready for your review.",
    time: "3 hours ago",
    type: "notice",
    target: "triage",
    unread: false,
  },
];

export function Navbar({ onTrySample, onLoadSample, onNavigate, currentView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [alerts, setAlerts] = useState(sampleAlerts);
  const bellRef = useRef(null);
  const unread = alerts.filter((a) => a.unread).length;

  const handleAction = () => {
    if (onTrySample) onTrySample();
    else if (onLoadSample) onLoadSample();
    else if (onNavigate) onNavigate("dashboard");
  };

  const handleLinkClick = (e, link) => {
    if (onNavigate) {
      if (link.view === "landing" && link.href.includes("#")) {
        if (currentView !== "landing") {
          e.preventDefault();
          onNavigate("landing");
          setTimeout(() => {
            const el = document.querySelector(link.href.substring(1));
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } else if (link.view) {
        e.preventDefault();
        onNavigate(link.view);
      }
    }
    setMenuOpen(false);
  };

  const handleAlertClick = (alert) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, unread: false } : a))
    );
    setBellOpen(false);
    if (alert.target && onNavigate) {
      onNavigate(alert.target);
    }
  };

  // Close on outside click and Esc
  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Lock page scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const markAllRead = () =>
    setAlerts((a) => a.map((x) => ({ ...x, unread: false })));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Title */}
        <a
          href="/"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate("landing");
            }
          }}
          className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 border border-blue-100 p-1 shadow-xs">
            <img
              src="/android-chrome-192x192.png"
              alt="Pehchaan Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold tracking-tight text-slate-900">
              Pehchaan
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Prototype
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => handleLinkClick(e, l)}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right: Notification Bell & CTA */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((o) => !o)}
              aria-label={`Notifications, ${unread} unread`}
              aria-expanded={bellOpen}
              aria-haspopup="true"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors shadow-xs"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unread}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {bellOpen && (
              <div className="fixed left-4 right-4 top-16 z-50 max-h-[75vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 sm:max-h-[500px]">
                {/* Popover Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h2>
                    {unread > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {unread} unread
                      </span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Popover Alert List */}
                {alerts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    You're all caught up.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {alerts.map((a) => {
                      const isThreat = a.type === "threat";
                      const isApp = a.type === "app";
                      const isDpdp = a.type === "dpdp";

                      return (
                        <li
                          key={a.id}
                          onClick={() => handleAlertClick(a)}
                          className={`flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                            a.unread ? "bg-blue-50/30" : ""
                          }`}
                        >
                          {/* Alert Icon */}
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isThreat
                                ? "bg-red-50 text-red-600"
                                : isApp
                                ? "bg-amber-50 text-amber-600"
                                : isDpdp
                                ? "bg-blue-50 text-blue-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {isThreat && <ShieldAlert className="h-4 w-4" />}
                            {isApp && <Smartphone className="h-4 w-4" />}
                            {isDpdp && <ShieldCheck className="h-4 w-4" />}
                            {!isThreat && !isApp && !isDpdp && (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>

                          {/* Alert Text */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {a.title}
                              </p>
                              <span className="shrink-0 text-[11px] text-slate-500">
                                {a.time}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                              {a.body}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {a.unread && (
                            <span
                              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                              aria-hidden="true"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Popover Footer */}
                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
                  Real-time threat monitoring feed
                </div>
              </div>
            )}
          </div>

          {/* CTA: Try Sample Brand */}
          <button
            type="button"
            onClick={handleAction}
            className="hidden sm:inline-flex items-center justify-center h-10 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Try sample brand
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden shadow-xs"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Accordion Panel */}
      {menuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-slate-200 bg-white px-4 pb-6 pt-2 lg:hidden shadow-lg"
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => handleLinkClick(e, l)}
              className="flex h-12 items-center border-b border-slate-100 text-sm font-semibold text-slate-800 hover:text-blue-600"
            >
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              handleAction();
            }}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            Try sample brand
          </button>
        </nav>
      )}
    </header>
  );
}

export default Navbar;