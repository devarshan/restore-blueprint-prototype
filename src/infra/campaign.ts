export const DEFAULT_CAMPAIGN_SLUG = 'conference';

export function displayCampaignName(name?: string | null, slug?: string | null): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  if (/^(restore|conference|default)$/i.test(trimmed)) return undefined;
  if (slug && trimmed.toLowerCase() === slug.toLowerCase()) {
    return trimmed
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return trimmed;
}
