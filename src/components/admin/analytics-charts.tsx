export function BarList({
  items,
  valueFormatter = (v: number) => String(v),
  emptyLabel = 'No data yet',
}: {
  items: Array<{ label: string; value: number }>;
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-500 py-6 text-center">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="flex items-center gap-3">
          <div className="w-28 md:w-36 shrink-0 text-sm text-ink-700 truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-2 bg-ink-900/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-400 rounded-full"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
              title={`${item.label}: ${valueFormatter(item.value)}`}
            />
          </div>
          <div className="w-16 shrink-0 text-right text-sm tabular text-ink-900 font-medium">
            {valueFormatter(item.value)}
          </div>
        </li>
      ))}
    </ul>
  );
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

export function TrendChart({
  data,
  valueFormatter = (v: number) => String(v),
  labelFormatter = dateLabel,
}: {
  data: Array<{ date: string; count: number }>;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (iso: string) => string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p className="text-sm text-ink-500 py-10 text-center">No activity in this period yet</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 min-w-[2px] bg-gold-400 rounded-t-sm hover:bg-gold-500 transition-colors"
            style={{ height: `${d.count > 0 ? Math.max((d.count / max) * 100, 4) : 1}%` }}
            title={`${labelFormatter(d.date)}: ${valueFormatter(d.count)}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-ink-500 uppercase tracking-[0.1em]">
        <span>{labelFormatter(data[0].date)}</span>
        <span>{labelFormatter(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

export { dateLabel, timeLabel };
