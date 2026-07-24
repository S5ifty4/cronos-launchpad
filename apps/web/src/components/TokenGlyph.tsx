import type { Launch } from '../data/types';

export function TokenGlyph({ launch, size = 'normal' }: { launch: Pick<Launch, 'symbol' | 'color'>; size?: 'normal' | 'large' }) {
  return (
    <div className={`tokenGlyph ${size === 'large' ? 'tokenGlyphLarge' : ''}`} style={{ '--glyph': launch.color } as React.CSSProperties}>
      <span>{launch.symbol.slice(0, 2)}</span>
    </div>
  );
}
