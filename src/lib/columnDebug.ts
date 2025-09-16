// Debug utility for column visibility/order tracking
// Activate with: localStorage.setItem('INVEST_COL_DEBUG', '1')

export const colDbg = {
  enabled(): boolean {
    try {
      return localStorage.getItem('INVEST_COL_DEBUG') === '1';
    } catch {
      return false;
    }
  },
  snap(columns: Array<{ key: string; visible: boolean; order?: number; required?: boolean }>) {
    return (columns || []).map((c) => ({ key: c.key, v: c.visible, o: c.order ?? 0, r: !!c.required }));
  },
  log(event: string, payload?: any) {
    if (!this.enabled()) return;
    try {
      // Small, consistent prefix for filtering
      // eslint-disable-next-line no-console
      console.info(`[INVEST COLS] ${event}`, payload ?? '');
    } catch {}
  },
};
