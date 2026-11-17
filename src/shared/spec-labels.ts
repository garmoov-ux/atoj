export const VIOLATION_LABELS: Record<number, string> = {
  1: '속도위반',
  2: '버스전용차로위반',
  3: '신호위반',
  4: '갓길위반',
  5: '신호위반',
  7: '교차로통행방법위반',
};

export const CAR_TYPE_LABELS: Record<number, string> = {
  1: '승용차',
  2: '버스/승합',
  3: '대형화물차',
  4: '소형화물차',
  5: '특수차',
  6: '미분류',
};

export const SIGNAL_SHAPE_LABELS: Record<number, string> = {
  1: '녹색',
  2: '황색',
  3: '좌회전',
  4: '우회전',
  5: '적색',
  6: '직좌동시',
  7: '점멸',
  8: '소등',
  9: '고장',
};

export const CAR_DIRECTION_LABELS: Record<number, string> = {
  1: '직진',
  2: '좌회전',
  3: '우회전',
  4: '정지',
};

export const SIGNAL_TYPE_LABELS: Record<number, string> = {
  1: '3색등 (적·황·좌)',
  2: '3색등 (적·황·직)',
  3: '4색등 (적·황·좌·직)',
  4: '5색등 (적·황·좌·직·우)',
};

export function formatViolationTimestamp(raw17: string): string {
  const clean = raw17.trim();
  if (clean.length >= 14) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    const hh = clean.slice(8, 10);
    const mm = clean.slice(10, 12);
    const ss = clean.slice(12, 14);
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  return clean;
}
