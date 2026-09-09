export type EmailDesignKey = "default" | "dossier" | "atelier" | "midnight" | "plate" | "folio";

export const EMAIL_DESIGN_OPTIONS: Array<{ key: EmailDesignKey; label: string; note: string }> = [
  { key: "default", label: "Current (Apex / Aurora / Horizon)", note: "Sends the chronotype email now in production. One template per type: Apex, Aurora, Horizon." },
  { key: "dossier", label: "White", note: "White result email with the schedule card and the two peak windows." },
  { key: "atelier", label: "Mist", note: "Result email on Restore teal, schedule card full width." },
  { key: "plate", label: "Hours", note: "Result email that leads with the two peak windows." },
  { key: "midnight", label: "Night", note: "Short navy result email. Use if Gmail is clipping the longer layouts." },
  { key: "folio", label: "Split", note: "Result email with copy on the left and the schedule card on the right." },
];

function emailDesignOption(key: string) {
  return EMAIL_DESIGN_OPTIONS.find((item) => item.key === key) || EMAIL_DESIGN_OPTIONS[0];
}

export function emailDesignLabel(key: string): string {
  return emailDesignOption(key).label;
}

export function emailDesignNote(key: string): string {
  return emailDesignOption(key).note;
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
