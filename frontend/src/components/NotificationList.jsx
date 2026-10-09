'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  FileText,
  X,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';

export function NotificationList({ onNavigate, customTrigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'High Severity Threat Flagged',
      message: "Bluesky handle 'lumora-bank-support.bsky.social' flagged with 91% similarity score.",
      time: '2 mins ago',
      type: 'threat',
      read: false,
      target: 'triage',
    },
    {
      id: 'notif-2',
      title: 'Google Play App Clone Found',
      message: "Unauthorized package 'com.lumora.bank.mobile' detected mimicking developer logo.",
      time: '15 mins ago',
      type: 'app',
      read: false,
      target: 'scans',
    },
    {
      id: 'notif-3',
      title: 'DPDP 7-Day Auto-Purge Scheduled',
      message: 'Current workspace data will automatically be purged per India DPDP Act 2023.',
      time: '1 hour ago',
      type: 'dpdp',
      read: true,
      target: 'privacy',
    },
    {
      id: 'notif-4',
      title: 'Takedown Notice Generated',
      message: 'AI drafted platform abuse notice for ticket #det_101.',
      time: '3 hours ago',
      type: 'notice',
      read: true,
      target: 'triage',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (item) => {
    setNotifications(
      notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.target && onNavigate) {
      onNavigate(item.target);
    }
    setIsOpen(false);
  };

  const getIconBadge = (type) => {
    switch (type) {
      case 'threat':
        return (
          <div className="size-8 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="size-4 text-red-500" />
          </div>
        );
      case 'app':
        return (
          <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="size-4 text-amber-400" />
          </div>
        );
      case 'dpdp':
        return (
          <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="size-4 text-blue-400" />
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block">
      {/* Bell Trigger Button */}
      {customTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{customTrigger(unreadCount)}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer outline-none rounded-full hover:bg-neutral-800/60"
          title="Threat Telemetry Notifications"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black shadow">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Click-outside backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9998] cursor-default"
        />
      )}

      {/* Popover Card Stack Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 bg-[#0e0f15] border border-neutral-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden text-neutral-200"
          >
            {/* Top Toolbar Header */}
            <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-headline">
                  THREAT TELEMETRY ALERTS
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="size-3" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
                  title={isExpanded ? 'Stack Cards' : 'Expand All'}
                >
                  <ChevronDown
                    className={`size-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notification Card Container */}
            <div className="p-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No active threat notifications
                </div>
              ) : (
                <div
                  onMouseEnter={() => setIsExpanded(true)}
                  onMouseLeave={() => setIsExpanded(false)}
                  className={`relative flex flex-col gap-2 transition-all duration-300 ${
                    isExpanded ? 'max-h-96 overflow-y-auto pr-1' : 'min-h-[140px]'
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {notifications.map((item, index) => {
                      const isTop = index === 0;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -20, scale: 0.9 }}
                          animate={{
                            opacity: isExpanded ? 1 : 1 - index * 0.18,
                            y: isExpanded ? 0 : index * 6,
                            scale: isExpanded ? 1 : 1 - index * 0.04,
                            zIndex: notifications.length - index,
                          }}
                          exit={{ opacity: 0, x: 50, scale: 0.8 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                          }}
                          onClick={() => handleNotificationClick(item)}
                          className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isTop && !isExpanded ? 'shadow-xl' : ''
                          } ${
                            item.read
                              ? 'bg-[#121319] border-neutral-800/90 text-neutral-300'
                              : 'bg-[#181a22] border-neutral-700/80 text-white shadow-md'
                          } hover:border-neutral-600`}
                        >
                          <div className="flex gap-3 items-start">
                            {/* Colored Badge Icon */}
                            {getIconBadge(item.type)}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-xs font-bold text-white truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                                  {item.time}
                                </span>
                              </div>

                              <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-2">
                                {item.message}
                              </p>
                            </div>

                            {/* Dismiss button */}
                            <button
                              onClick={(e) => removeNotification(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white rounded transition-opacity cursor-pointer"
                              title="Dismiss notification"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Card Stack Footer */}
            <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-500">
                {isExpanded ? 'Hover out to stack' : 'Hover to expand stack'}
              </span>
              <button
                onClick={() => {
                  onNavigate && onNavigate('triage');
                  setIsOpen(false);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
              >
                Open SOC Triage Desk →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
