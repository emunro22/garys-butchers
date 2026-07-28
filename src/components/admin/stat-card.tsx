export function StatCard({
  label,
  value,
  icon,
  tone = 'plain',
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'plain' | 'gold';
  sublabel?: string;
}) {
  return (
    <div
      className={`p-5 border border-ink-900/10 ${
        tone === 'gold' ? 'bg-ink-900 text-cream-50' : 'bg-cream-100'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`eyebrow ${tone === 'gold' ? 'text-gold-400' : 'text-ink-500'}`}>{label}</p>
        <span className={tone === 'gold' ? 'text-gold-400' : 'text-ink-400'}>{icon}</span>
      </div>
      <p
        className={`font-display text-3xl ${
          tone === 'gold' ? 'text-cream-50' : 'text-ink-900'
        } tabular`}
      >
        {value}
      </p>
      {sublabel && (
        <p className={`text-xs mt-1 ${tone === 'gold' ? 'text-cream-200/60' : 'text-ink-500'}`}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
