import type { SocialLink, SocialPlatform } from '../data/types';

const platformLabels: Record<SocialPlatform, string> = {
  website: 'Website',
  x: 'X',
  discord: 'Discord',
  telegram: 'Telegram',
};

const platformOrder: SocialPlatform[] = ['website', 'x', 'discord', 'telegram'];

export function normalizeSocialPlatform(value: string): SocialPlatform {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'web' || normalized === 'website' || normalized === 'site') return 'website';
  if (normalized === 'x' || normalized === 'twitter') return 'x';
  if (normalized === 'discord') return 'discord';
  if (normalized === 'telegram' || normalized === 'tg') return 'telegram';
  return 'website';
}

function fallbackUrl(platform: SocialPlatform) {
  if (platform === 'website') return 'https://cronosforge.com';
  if (platform === 'x') return 'https://x.com/cronos_chain';
  if (platform === 'discord') return 'https://discord.com';
  return 'https://t.me/cronos_official';
}

export function normalizeSocialUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString();
  } catch {
    if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
      try { return new URL(`https://${trimmed}`).toString(); } catch { return ''; }
    }
    return '';
  }
}

export function normalizeSocial(value: string | SocialLink): SocialLink | null {
  if (typeof value === 'string') {
    const platform = normalizeSocialPlatform(value);
    return { platform, url: fallbackUrl(platform) };
  }
  const platform = normalizeSocialPlatform(value.platform);
  const url = normalizeSocialUrl(value.url);
  return url ? { platform, url } : null;
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === 'x') return <span aria-hidden="true" className="socialGlyph socialGlyphText">𝕏</span>;
  if (platform === 'website') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="socialGlyph">
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.2 2.3 3.3 5.3 3.3 9S14.2 18.7 12 21M12 3C9.8 5.3 8.7 8.3 8.7 12s1.1 6.7 3.3 9M3.6 9h16.8M3.6 15h16.8" />
      </svg>
    );
  }
  if (platform === 'discord') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="socialGlyph">
        <path d="M8.2 7.3c2.5-.9 5.1-.9 7.6 0l.8-1.5c1.7.5 3.2 1.3 4.4 2.4-.6 4.8-2 8.1-4.2 9.9-1.2-.2-2.3-.7-3.3-1.4l.8-1.1c-.8.3-1.5.4-2.3.4s-1.5-.1-2.3-.4l.8 1.1c-1 .7-2.1 1.2-3.3 1.4C5 16.3 3.6 13 3 8.2c1.2-1.1 2.7-1.9 4.4-2.4l.8 1.5Z" />
        <path d="M9.4 12.4h.1M14.5 12.4h.1" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="socialGlyph">
      <path d="m21 4-4.2 16-5.1-5.2-3.3 3.1.7-4.8L3 10.7 21 4Z" />
      <path d="m9.1 13.1 7.7-5.2" />
    </svg>
  );
}

export function SocialLinks({ socials }: { socials: (string | SocialLink)[] }) {
  const byPlatform = new Map<SocialPlatform, SocialLink>();
  socials.filter(Boolean).map(normalizeSocial).forEach((link) => {
    if (link) byPlatform.set(link.platform, link);
  });
  const links = platformOrder.map((platform) => byPlatform.get(platform)).filter(Boolean) as SocialLink[];
  if (!links.length) return null;
  return (
    <div className="socials" aria-label="Social links">
      {links.map((link) => (
        <a className="socialIcon" key={link.platform} href={link.url} target="_blank" rel="noreferrer" title={platformLabels[link.platform]} aria-label={platformLabels[link.platform]} onClick={(event) => event.stopPropagation()}>
          <SocialIcon platform={link.platform} />
          <span className="srOnly">{platformLabels[link.platform]}</span>
        </a>
      ))}
    </div>
  );
}
