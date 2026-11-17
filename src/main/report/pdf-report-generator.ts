import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import type { MonthlyStatsReport } from '@shared/types/domain';

function buildReportHtml(report: MonthlyStatsReport): string {
  const [year, month] = report.yearMonth.split('-');
  const todayStr = new Date().toISOString().slice(0, 10);
  const successRate =
    report.totalProcessed > 0
      ? ((report.totalSuccess / report.totalProcessed) * 100).toFixed(1)
      : '100.0';
  const speedPct =
    report.totalSuccess > 0 ? ((report.speedCount / report.totalSuccess) * 100).toFixed(1) : '0.0';
  const signalPct =
    report.totalSuccess > 0 ? ((report.signalCount / report.totalSuccess) * 100).toFixed(1) : '0.0';

  const maxDaily = Math.max(...report.dailyStats.map((d) => d.totalCount), 1);
  const barsHtml =
    report.dailyStats.length === 0
      ? '<div style="padding:28px;text-align:center;color:#64748b;font-size:12px;">해당 월에 집계된 단속 변환 데이터가 없습니다.</div>'
      : `<div style="display:flex;align-items:flex-end;gap:6px;height:130px;padding:16px 10px 6px;border-bottom:1px solid #cbd5e1;">
          ${report.dailyStats
            .map((d) => {
              const totalH = Math.max(Math.round((d.totalCount / maxDaily) * 92), 4);
              const sigH = d.totalCount > 0 ? Math.round((d.signalCount / d.totalCount) * totalH) : 0;
              const spdH = Math.max(totalH - sigH, 0);
              return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:16px;">
                <div style="font-size:9px;font-weight:700;color:#0f172a;margin-bottom:3px;">${d.totalCount}</div>
                <div style="width:100%;max-width:22px;display:flex;flex-direction:column;border-radius:3px 3px 0 0;overflow:hidden;">
                  <div style="height:${sigH}px;background:#e11d48;"></div>
                  <div style="height:${spdH}px;background:#2563eb;"></div>
                </div>
                <div style="font-size:9px;color:#475569;margin-top:4px;">${d.label.replace('일', '')}</div>
              </div>`;
            })
            .join('')}
        </div>`;

  const deviceRowsHtml =
    report.deviceStats.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:16px;color:#64748b;">집계된 장비 실적이 없습니다.</td></tr>'
      : report.deviceStats
          .map((dev, i) => {
            const share =
              report.totalSuccess > 0
                ? ((dev.totalCount / report.totalSuccess) * 100).toFixed(1)
                : '0.0';
            return `<tr>
              <td style="text-align:center;">${i + 1}</td>
              <td style="font-weight:700;color:#0f172a;">${dev.deviceCode}</td>
              <td style="text-align:right;font-weight:700;">${dev.totalCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#1d4ed8;">${dev.speedCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#e11d48;">${dev.signalCount.toLocaleString()}건</td>
              <td style="text-align:right;">${dev.avgSpeed} / ${dev.maxSpeed} km/h</td>
              <td style="text-align:right;">${share}%</td>
            </tr>`;
          })
          .join('');

  const dailyRowsHtml =
    report.dailyStats.length === 0
      ? '<tr><td colspan="5" style="text-align:center;padding:16px;color:#64748b;">집계된 일자별 내역이 없습니다.</td></tr>'
      : report.dailyStats
          .map(
            (d) => `<tr>
              <td>${d.day}</td>
              <td style="text-align:right;font-weight:700;">${d.totalCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#1d4ed8;">${d.speedCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#e11d48;">${d.signalCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#64748b;">${d.failedCount.toLocaleString()}건</td>
            </tr>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic", -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 18px 22px; font-size: 11px; line-height: 1.45; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .badge { display: inline-block; background: #1e293b; color: #38bdf8; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 4px; margin-bottom: 5px; }
  h1 { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
  .meta-table { border-collapse: collapse; font-size: 10px; }
  .meta-table td { border: 1px solid #cbd5e1; padding: 3px 8px; }
  .meta-table td.lbl { background: #f1f5f9; font-weight: 700; color: #334155; }
  h2 { font-size: 13px; font-weight: 700; color: #0f172a; margin: 14px 0 6px; padding-left: 8px; border-left: 3px solid #2563eb; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
  .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
  .kpi-box .k-label { font-size: 10px; color: #64748b; font-weight: 600; }
  .kpi-box .k-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
  .kpi-box .k-sub { font-size: 9.5px; color: #475569; margin-top: 1px; }
  .chart-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #ffffff; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  table.data-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; font-weight: 700; color: #334155; }
  table.data-table td { border: 1px solid #cbd5e1; padding: 4.5px 8px; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="badge">무인교통단속장비 규격 변환기 (AtoJ v2.1.0) 공식 보고서</div>
      <h1>${year}년 ${month}월 무인교통단속 데이터 규격 변환 운영 보고서</h1>
    </div>
    <table class="meta-table">
      <tr><td class="lbl">대상 연월</td><td>${year}년 ${month}월</td><td class="lbl">발행 일자</td><td>${todayStr}</td></tr>
      <tr><td class="lbl">적용 규격</td><td colspan="3">경찰-6310-98-0001 (아규격 → 자규격 .DAT)</td></tr>
      <tr><td class="lbl">제출·지원</td><td colspan="3">㈜ 이노네트웍스 · 강홍선 (s_gain@naver.com)</td></tr>
    </table>
  </div>

  <h2>1. 월간 단속 변환 총괄 요약</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="k-label">월간 정상 변환 완료</div>
      <div class="k-val" style="color:#2563eb;">${report.totalSuccess.toLocaleString()}건</div>
      <div class="k-sub">총 처리 ${report.totalProcessed.toLocaleString()}건 (성공률 ${successRate}%)</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">속도위반 (코드 1)</div>
      <div class="k-val" style="color:#1d4ed8;">${report.speedCount.toLocaleString()}건</div>
      <div class="k-sub">전체 단속 대비 ${speedPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">신호위반 (코드 3)</div>
      <div class="k-val" style="color:#e11d48;">${report.signalCount.toLocaleString()}건</div>
      <div class="k-sub">전체 단속 대비 ${signalPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">운영 장비 · 위반속도</div>
      <div class="k-val">${report.activeDeviceCount}대</div>
      <div class="k-sub">평균 ${report.avgSpeed}km/h · 최고 ${report.maxSpeed}km/h</div>
    </div>
  </div>

  <h2>2. 일자별 단속 변환 추이 (청색: 속도위반 / 적색: 신호위반)</h2>
  <div class="chart-card">${barsHtml}</div>

  <h2>3. 장비번호(LocalNo)별 단속 변환 실적</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:45px;text-align:center;">순위</th>
        <th>장비번호 (LocalNo)</th>
        <th style="text-align:right;">정상 변환 합계</th>
        <th style="text-align:right;">속도위반 (코드1)</th>
        <th style="text-align:right;">신호위반 (코드3)</th>
        <th style="text-align:right;">평균 / 최고속도</th>
        <th style="text-align:right;">비중</th>
      </tr>
    </thead>
    <tbody>${deviceRowsHtml}</tbody>
  </table>

  <h2>4. 일자별 상세 변환 실적</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>단속 일자</th>
        <th style="text-align:right;">정상 변환 합계</th>
        <th style="text-align:right;">속도위반 (코드1)</th>
        <th style="text-align:right;">신호위반 (코드3)</th>
        <th style="text-align:right;">오류 건수</th>
      </tr>
    </thead>
    <tbody>${dailyRowsHtml}</tbody>
  </table>

  <div class="footer">
    <span>프로그램명: AtoJ (무인교통단속장비 규격 변환기 v2.1.0) · 경찰-6310-98-0001-아 → 자(.DAT)</span>
    <span>회사: ㈜ 이노네트웍스 | 제작자: 강홍선 (s_gain@naver.com)</span>
  </div>
</body>
</html>`;
}

export async function generateMonthlyReportPdf(
  report: MonthlyStatsReport,
  outputPath: string,
): Promise<void> {
  const html = buildReportHtml(report);
  const printWin = new BrowserWindow({
    width: 794,
    height: 1123,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await printWin.loadURL(dataUrl);
    const pdfBuffer = await printWin.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
    });
    fs.writeFileSync(outputPath, pdfBuffer);
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.destroy();
    }
  }
}
