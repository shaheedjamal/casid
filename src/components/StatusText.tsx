interface StatusTextProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; glyph: string; tone: string }> = {
  published: { label: 'Published', glyph: '●', tone: 'text-emerald-700' },
  active: { label: 'Active', glyph: '●', tone: 'text-emerald-700' },
  responded: { label: 'Responded', glyph: '●', tone: 'text-emerald-700' },
  draft: { label: 'Draft', glyph: '○', tone: 'text-slate-600' },
  pending_review: { label: 'Pending Approval', glyph: '▲', tone: 'text-amber-700' },
  pending: { label: 'Pending', glyph: '▲', tone: 'text-amber-700' },
  reviewed: { label: 'Reviewed', glyph: '◆', tone: 'text-blue-700' },
  closed: { label: 'Closed', glyph: '■', tone: 'text-slate-500' },
  inactive: { label: 'Inactive', glyph: '■', tone: 'text-slate-500' },
  archived: { label: 'Archived', glyph: '■', tone: 'text-rose-700' },
};

export function StatusText({ status }: StatusTextProps) {
  const cfg = STATUS_MAP[status] || { label: status, glyph: '○', tone: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${cfg.tone}`}>
      <span aria-hidden="true" className="text-[10px] leading-none">
        {cfg.glyph}
      </span>
      <span>{cfg.label}</span>
    </span>
  );
}
