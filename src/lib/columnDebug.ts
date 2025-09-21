// Debug utility for column visibility/order tracking
// Production-safe debug utility - disabled in production

export const colDbg = {
  enabled(): boolean {
    try {
      return process.env.NODE_ENV !== 'production' && localStorage.getItem('INVEST_COL_DEBUG') === '1';
    } catch {
      return false;
    }
  },
  snap(columns: Array<{ key: string; visible: boolean; order?: number; required?: boolean }>) {
    if (!this.enabled()) return [];
    return (columns || []).map((c) => ({ key: c.key, v: c.visible, o: c.order ?? 0, r: !!c.required }));
  },
  log(event: string, payload?: any) {
    if (!this.enabled()) return;
    try {
      // eslint-disable-next-line no-console
      console.info(`[INVEST COLS] ${event}`, payload ?? '');
    } catch {}
  },
};
