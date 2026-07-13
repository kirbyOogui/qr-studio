"use client";

import { useId, useState, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
  /** タブを一目で見分けやすくするための色(選択中のドットに使う)。省略時は色分けしない。 */
  accentColor?: string;
}

interface TabsProps {
  tabs: Tab[];
  ariaLabel: string;
}

export function Tabs({ tabs, ariaLabel }: TabsProps) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const idBase = useId();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* このタブバー自体はflex-colの中でshrink-0(下のパネル領域だけがflex-1で
          スクロールする)なので、スクロールしても常に上に表示され続ける。
          ページ全体に対するsticky(以前の実装)は、下から重なってくる要素と
          衝突して不自然に見えたためやめ、レイアウトの構造だけで解決している。 */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="mb-4 flex shrink-0 flex-wrap gap-1 rounded-full bg-black/[0.04] p-1 lg:mb-6"
      >
        {tabs.map((tab) => {
          const selected = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${idBase}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${tab.key}`}
              onClick={() => setActiveKey(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                selected ? "bg-white text-ink shadow-soft" : "text-ink/55 hover:text-ink"
              }`}
            >
              {tab.accentColor && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full transition-opacity"
                  style={{ backgroundColor: tab.accentColor, opacity: selected ? 1 : 0.45 }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            id={`${idBase}-panel-${tab.key}`}
            aria-labelledby={`${idBase}-tab-${tab.key}`}
            hidden={tab.key !== activeKey}
            className="animate-fade-in"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
