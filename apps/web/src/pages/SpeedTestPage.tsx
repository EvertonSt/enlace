import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageTransition from "../components/ui/PageTransition";

type TS = "idle" | "testing-download" | "testing-upload" | "testing-latency" | "done";
interface SR { download: number; upload: number; latency: number; server: string }

const DL = "https://speed.cloudflare.com/__down?bytes=10000000";
const UL = "https://speed.cloudflare.com/__up";
const META = "https://speed.cloudflare.com/meta";

async function measureLatency(): Promise<number> {
  const t: number[] = [];
  for (let i = 0; i < 5; i++) {
    const s = performance.now();
    await fetch(META, { method: "HEAD", cache: "no-store" });
    t.push(performance.now() - s);
  }
  const sorted = t.sort((a, b) => a - b); return Math.round(sorted[2] ?? sorted[sorted.length - 1] ?? 0);
}

async function measureDL(onP: (m: number) => void): Promise<number> {
  const s = performance.now();
  const res = await fetch(DL + "&r=" + Math.random(), { cache: "no-store" });
  const reader = res.body?.getReader();
  if (!reader) return 0;
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    const e = (performance.now() - s) / 1000;
    if (e > 0.2) onP((bytes * 8) / (e * 1_000_000));
  }
  const e = (performance.now() - s) / 1000;
  return Math.round((bytes * 8) / (e * 1_000_000) * 10) / 10;
}

async function measureUL(onP: (m: number) => void): Promise<number> {
  const p = new Uint8Array(5_000_000);
  crypto.getRandomValues(p);
  const s = performance.now();
  await fetch(UL, { method: "POST", body: p, cache: "no-store" });
  const e = (performance.now() - s) / 1000;
  const m = Math.round((p.length * 8) / (e * 1_000_000) * 10) / 10;
  onP(m);
  return m;
}

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function SpeedTestPage() {
  const { t } = useTranslation();
  const [state, setState] = useState<TS>("idle");
  const [result, setResult] = useState<SR | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async () => {
    abortRef.current = new AbortController();
    setResult(null); setProgress(0);
    try {
      setState("testing-download"); setProgress(0);
      const download = await measureDL((m) => setProgress(Math.min(m / 500 * 100, 95)));
      setState("testing-upload"); setProgress(0);
      const upload = await measureUL((m) => setProgress(Math.min(m / 200 * 100, 95)));
      setState("testing-latency"); setProgress(50);
      const latency = await measureLatency(); setProgress(100);
      setResult({ download, upload, latency, server: "Cloudflare" });
      setState("done");
      toast.success(t("speedTest.title") + " complete");
    } catch { setState("idle"); toast.error(t("common.error")); }
  }, [t]);

  const sc = (m: number, mx: number) => m / mx > 0.7 ? "text-green-500 dark:text-green-400" : m / mx > 0.3 ? "text-yellow-500 dark:text-yellow-400" : "text-red-500 dark:text-red-400";
  const busy = state !== "idle" && state !== "done";

  return (
    <PageTransition>
      <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
        <motion.h1 variants={fadeUp} className="text-2xl font-bold text-gray-900 dark:text-white">{t("speedTest.title")}</motion.h1>
        <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                <circle cx="100" cy="100" r="85" fill="none" strokeWidth="8" stroke="url(#grad)" strokeLinecap="round" strokeDasharray={2 * Math.PI * 85} strokeDashoffset={2 * Math.PI * 85 * (1 - progress / 100)} transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 0.3s ease" }} />
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {state === "idle" && !result && <><div className="text-4xl font-bold text-gray-300 dark:text-gray-600">---</div><div className="text-xs text-gray-400">{t("speedTest.start")}</div></>}
                {busy && <><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-3xl font-bold text-brand-600 dark:text-brand-400">{state === "testing-download" ? "\u2193" : state === "testing-upload" ? "\u2191" : "\u26A1"}</motion.div><div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{state === "testing-download" ? t("speedTest.download") : state === "testing-upload" ? t("speedTest.upload") : t("speedTest.latency")}</div></>}
                {state === "done" && result && <><div className="text-3xl font-bold text-gray-900 dark:text-white">{result.download}</div><div className="text-xs text-gray-500">Mbps</div></>}
              </div>
            </div>
            {state === "idle" && <button onClick={runTest} className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] dark:bg-brand-500">{t("speedTest.start")}</button>}
            {busy && <div className="text-sm text-gray-500 dark:text-gray-400">{t("speedTest.testing")}...</div>}
          </div>
        </motion.div>
        {state === "done" && result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[{ l: t("speedTest.download"), v: result.download, u: "Mbps", mx: 500 }, { l: t("speedTest.upload"), v: result.upload, u: "Mbps", mx: 200 }, { l: t("speedTest.latency"), v: result.latency, u: "ms", mx: 100 }].map((r, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="text-sm text-gray-500 dark:text-gray-400">{r.l}</div>
                <div className={"mt-1 text-2xl font-bold " + sc(r.v, r.mx)}>{r.v} <span className="text-sm font-normal">{r.u}</span></div>
              </div>
            ))}
          </motion.div>
        )}
        {state === "done" && <motion.div variants={fadeUp} className="text-center"><button onClick={runTest} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{t("speedTest.start")} Again</button></motion.div>}
      </motion.div>
    </PageTransition>
  );
}
