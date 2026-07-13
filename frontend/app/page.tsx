import { QrStudio } from "@/features/qr-studio/QrStudio";

const FEATURE_CHIPS: { label: string; className: string }[] = [
  { label: "無料・登録不要", className: "bg-accent/10 text-accent" },
  { label: "保存しません(Stateless)", className: "bg-violet-500/10 text-violet-700" },
  { label: "最短30秒で完成", className: "bg-teal-500/10 text-teal-700" },
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 pt-16 text-center sm:max-w-4xl sm:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/[0.08] py-1.5 pl-1.5 pr-3.5 text-sm font-medium tracking-wide text-accent">
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-gradient">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" />
              <rect x="15.5" y="15.5" width="2.5" height="2.5" rx="0.5" fill="white" />
              <rect x="19" y="15.5" width="2.5" height="2.5" rx="0.5" fill="white" />
              <rect x="15.5" y="19" width="2.5" height="2.5" rx="0.5" fill="white" />
              <rect x="19" y="19" width="2.5" height="2.5" rx="0.5" fill="white" />
            </svg>
          </span>
          QR Studio
        </span>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight text-ink sm:text-[44px]">
          考えなくても、
          <br className="sm:hidden" />
          <span className="bg-accent-gradient bg-clip-text text-transparent">最高品質</span>
          のQRコード。
        </h1>
        <p className="mt-4 text-[17px] text-ink/50">
          URLを入力するだけで、読み取りやすく美しいQRコードを最短30秒で。
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {FEATURE_CHIPS.map((chip) => (
            <li key={chip.label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chip.className}`}>
              {chip.label}
            </li>
          ))}
        </ul>
      </header>
      <QrStudio />
      <footer className="mx-auto max-w-3xl px-4 pb-16 pt-4 text-center text-xs text-ink/35">
        入力したURL・生成したQR画像は一切保存されません。処理はすべてお使いのブラウザ上で完結します。
      </footer>
    </main>
  );
}
