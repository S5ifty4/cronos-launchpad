import type { ReactNode } from 'react';

export type BadgeTone = 'good' | 'warn' | 'bad' | 'neutral' | 'blue';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
