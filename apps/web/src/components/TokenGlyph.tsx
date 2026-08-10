import type { Launch } from '../data/types';

export function TokenGlyph({ launch, size = 'normal' }: { launch: Pick<Launch, 'symbol' | 'color' | 'imageUrl'>; size?: 'normal' | 'large' }) {
  return (
    <div className={`tokenGlyph ${size === 'large' ? 'tokenGlyphLarge' : ''}`} style={{ '--glyph': launch.color } as React.CSSProperties}>
      {launch.imageUrl ? <img src={launch.imageUrl} alt={`${launch.symbol} token artwork`} /> : <span>{launch.symbol.slice(0, 2)}</span>}
    </div>
  );
}
