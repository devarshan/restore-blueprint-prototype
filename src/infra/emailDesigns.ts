export type EmailDesignKey = "default" | "dossier" | "atelier" | "midnight" | "plate" | "folio";

export const EMAIL_DESIGN_OPTIONS: Array<{ key: EmailDesignKey; label: string; note: string }> = [
  { key: "default", label: "Current (Apex / Aurora / Horizon)", note: "The live chronotype emails." },
  { key: "dossier", label: "The Dossier", note: "Paper research file. Light plate." },
  { key: "atelier", label: "The Atelier", note: "Conference letter. Light plate." },
  { key: "midnight", label: "Midnight Brief", note: "Dark brief. Dark clock." },
  { key: "plate", label: "The Plate", note: "Gallery caption. Light plate." },
  { key: "folio", label: "The Folio", note: "Brand monograph. Light plate." },
];

export function emailDesignLabel(key: string): string {
  const match = EMAIL_DESIGN_OPTIONS.find((item) => item.key === key);
  return match?.label || EMAIL_DESIGN_OPTIONS[0].label;
}

export function parseEmailDesign(value: string): EmailDesignKey {
  const key = value.trim().toLowerCase();
  switch (key) {
    case "dossier":
    case "atelier":
    case "midnight":
    case "plate":
    case "folio":
      return key;
    case "default":
    case "chronotype":
    case "future-of-work":
    case "":
      return "default";
    default:
      return "default";
  }
}
