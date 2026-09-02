import React from 'react';
import { motion } from 'motion/react';

export interface LiquidGooeyTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface LiquidGooeyTabsProps<T extends string = string> {
  tabs: LiquidGooeyTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  idPrefix?: string;
}

export function LiquidGooeyTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  idPrefix = 'liquid-tab',
}: LiquidGooeyTabsProps<T>) {
  return (
    <div
      className={`relative inline-flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-inner ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 select-none ${
              isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{tab.icon}</span>}
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}

            {/* Morphing Liquid Active Background */}
            {isActive && (
              <motion.div
                layoutId={`active-liquid-tab-${idPrefix}`}
                className="absolute inset-0 z-[-1] rounded-lg bg-white shadow-xs border border-slate-200"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 28,
                  mass: 0.8,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
