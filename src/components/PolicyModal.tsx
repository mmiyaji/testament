import { useState, useEffect } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";

type PolicyType = "terms" | "privacy";
type Theme = "light" | "dark" | "system";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
];

function getInitialTheme(): Theme {
  return (sessionStorage.getItem("theme") as Theme) || "system";
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  sessionStorage.setItem("theme", theme);
}

export function PolicyModal({ compact }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState<PolicyType | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const content = open === "terms" ? t("policy.termsContent") : open === "privacy" ? t("policy.privacyContent") : "";
  const title = open === "terms" ? t("policy.terms") : t("policy.privacy");

  return (
    <>
      {/* Footer links */}
      <footer className={`flex items-center justify-center gap-3 text-xs text-muted-foreground ${compact ? "py-2" : "mt-12 pb-8"}`}>
        <button
          type="button"
          onClick={() => setOpen("terms")}
          className="hover:underline underline-offset-2"
        >
          {t("policy.terms")}
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => setOpen("privacy")}
          className="hover:underline underline-offset-2"
        >
          {t("policy.privacy")}
        </button>
        <span>·</span>
        <select
          value={i18n.language.startsWith("ja") ? "ja" : i18n.language.startsWith("en") ? "en" : i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="bg-transparent border border-border rounded px-1 py-0.5 text-xs cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <span>·</span>
        <span className="text-muted-foreground/50">© 2026 mmiyaji</span>
        <span>·</span>
        <a
          href="https://github.com/mmiyaji/testament"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-2 inline-flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          GitHub
        </a>
        <span>·</span>
        <span className="inline-flex items-center rounded border border-border overflow-hidden">
          {([
            { value: "light", icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
            )},
            { value: "dark", icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )},
            { value: "system", icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            )},
          ] as { value: Theme; icon: React.ReactNode }[]).map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              title={t(`theme.${value}`)}
              onClick={() => setTheme(value)}
              className={`px-2 py-1 transition-colors ${
                theme === value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {icon}
            </button>
          ))}
        </span>
      </footer>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-background rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-base">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return <h1 key={i} className="text-lg font-bold mb-3">{line.slice(2)}</h1>;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="font-semibold mt-4 mb-1">{line.slice(3)}</h2>;
                }
                if (line.startsWith("- ")) {
                  return <li key={i} className="ml-4 list-disc">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
                }
                if (line === "") {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
