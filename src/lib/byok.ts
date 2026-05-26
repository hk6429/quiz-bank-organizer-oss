"use client";

const KEYS = {
  sheetsUrl: "byok_sheets_url",
  sheetsSecret: "byok_sheets_secret",
  geminiKey: "byok_gemini_key",
} as const;

export type ByokConfig = {
  sheetsUrl: string;
  sheetsSecret: string;
  geminiKey: string;
};

export function getByok(): ByokConfig {
  if (typeof window === "undefined") {
    return { sheetsUrl: "", sheetsSecret: "", geminiKey: "" };
  }
  return {
    sheetsUrl: sessionStorage.getItem(KEYS.sheetsUrl) ?? "",
    sheetsSecret: sessionStorage.getItem(KEYS.sheetsSecret) ?? "",
    geminiKey: sessionStorage.getItem(KEYS.geminiKey) ?? "",
  };
}

export function setByok(cfg: Partial<ByokConfig>) {
  if (typeof window === "undefined") return;
  if (cfg.sheetsUrl !== undefined) sessionStorage.setItem(KEYS.sheetsUrl, cfg.sheetsUrl);
  if (cfg.sheetsSecret !== undefined) sessionStorage.setItem(KEYS.sheetsSecret, cfg.sheetsSecret);
  if (cfg.geminiKey !== undefined) sessionStorage.setItem(KEYS.geminiKey, cfg.geminiKey);
}

export function clearByok() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEYS.sheetsUrl);
  sessionStorage.removeItem(KEYS.sheetsSecret);
  sessionStorage.removeItem(KEYS.geminiKey);
}

export function hasSheets(c?: ByokConfig): boolean {
  const cfg = c ?? getByok();
  return cfg.sheetsUrl.length > 0 && cfg.sheetsSecret.length > 0;
}

export function hasGemini(c?: ByokConfig): boolean {
  const cfg = c ?? getByok();
  return cfg.geminiKey.length > 0;
}

export function byokHeaders(): Record<string, string> {
  const cfg = getByok();
  const h: Record<string, string> = {};
  if (cfg.sheetsUrl) h["X-Sheets-Url"] = cfg.sheetsUrl;
  if (cfg.sheetsSecret) h["X-Sheets-Secret"] = cfg.sheetsSecret;
  if (cfg.geminiKey) h["X-Gemini-Key"] = cfg.geminiKey;
  return h;
}
