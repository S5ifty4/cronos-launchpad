export function ChartMock() {
  return <div className="chartPanel"><div className="chartLine" /><div className="chartBars">{Array.from({ length: 36 }).map((_, index) => <span key={index} style={{ height: `${18 + ((index * 17) % 72)}%` }} />)}</div></div>;
}
