import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import type { MonthlyStatsReport } from '@shared/types/domain';

function buildReportHtml(report: MonthlyStatsReport): string {
  const [year, month] = report.yearMonth.split('-');
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalSuccess = report.totalSuccess;
  const speedCount = report.speedCount;
  const signalCount = report.signalCount;
  const otherCount = Math.max(0, totalSuccess - speedCount - signalCount);

  const successRate =
    report.totalProcessed > 0
      ? ((totalSuccess / report.totalProcessed) * 100).toFixed(1)
      : '100.0';
  const speedPct = totalSuccess > 0 ? ((speedCount / totalSuccess) * 100).toFixed(1) : '0.0';
  const signalPct = totalSuccess > 0 ? ((signalCount / totalSuccess) * 100).toFixed(1) : '0.0';
  const otherPct = totalSuccess > 0 ? ((otherCount / totalSuccess) * 100).toFixed(1) : '0.0';

  // 1) 일자별 추이 차트 (Y축 눈금 + 점선 그리드 + 누적 바)
  const maxDaily = Math.max(...report.dailyStats.map((d) => d.totalCount), 4);
  const yTicks = [
    maxDaily,
    Math.round(maxDaily * 0.75),
    Math.round(maxDaily * 0.5),
    Math.round(maxDaily * 0.25),
    0,
  ];

  const dailyChartHtml =
    report.dailyStats.length === 0
      ? '<div style="padding:28px;text-align:center;color:#64748b;font-size:11px;">해당 월에 집계된 단속 변환 데이터가 없습니다.</div>'
      : `<div style="display:flex;gap:8px;height:148px;padding:8px 6px 4px;">
          <div style="width:28px;display:flex;flex-direction:column;justify-content:space-between;padding:4px 0 18px;text-align:right;font-size:9px;color:#64748b;font-family:monospace;">
            ${yTicks.map((t) => `<span>${t}</span>`).join('')}
          </div>
          <div style="flex:1;position:relative;display:flex;flex-direction:column;">
            <div style="position:absolute;inset:4px 0 18px 0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;">
              ${yTicks
                .map(
                  (_, idx) =>
                    `<div style="width:100%;border-bottom:${idx === yTicks.length - 1 ? '1px solid #94a3b8' : '1px dashed #cbd5e1'};"></div>`,
                )
                .join('')}
            </div>
            <div style="flex:1;display:flex;align-items:flex-end;gap:6px;padding:4px 6px 18px;position:relative;z-index:2;">
              ${report.dailyStats
                .map((d) => {
                  const ratio = Math.min(d.totalCount / maxDaily, 1);
                  const totalH = Math.max(Math.round(ratio * 96), 4);
                  const sigH = d.totalCount > 0 ? Math.round((d.signalCount / d.totalCount) * totalH) : 0;
                  const spdH = d.totalCount > 0 ? Math.round((d.speedCount / d.totalCount) * totalH) : 0;
                  const etcH = Math.max(0, totalH - sigH - spdH);
                  return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:18px;position:relative;">
                    <div style="font-size:9px;font-weight:800;color:#0f172a;margin-bottom:2px;">${d.totalCount}</div>
                    <div style="width:100%;max-width:22px;display:flex;flex-direction:column;border-radius:4px 4px 0 0;overflow:hidden;">
                      ${sigH > 0 ? `<div style="height:${sigH}px;background:#e11d48;"></div>` : ''}
                      ${spdH > 0 ? `<div style="height:${spdH}px;background:#2563eb;"></div>` : ''}
                      ${etcH > 0 ? `<div style="height:${etcH}px;background:#64748b;"></div>` : ''}
                    </div>
                    <div style="position:absolute;bottom:-15px;font-size:9px;color:#475569;font-weight:600;white-space:nowrap;">${d.label}</div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </div>`;

  // 2) 위반유형 SVG 도넛 차트 & 장비별 비교/속도 분포 차트
  const radius = 44;
  const circum = 2 * Math.PI * radius;
  const speedLen = totalSuccess > 0 ? (speedCount / totalSuccess) * circum : 0;
  const signalLen = totalSuccess > 0 ? (signalCount / totalSuccess) * circum : 0;
  const otherLen = totalSuccess > 0 ? (otherCount / totalSuccess) * circum : 0;

  const maxDeviceTotal = Math.max(...report.deviceStats.map((d) => d.totalCount), 1);
  const deviceBarsHtml =
    report.deviceStats.length === 0
      ? '<div style="padding:20px;text-align:center;color:#64748b;">집계된 장비 데이터가 없습니다.</div>'
      : report.deviceStats
          .slice(0, 6)
          .map((dev) => {
            const widthPct = Math.max(Math.round((dev.totalCount / maxDeviceTotal) * 100), 5);
            const spdShare =
              dev.totalCount > 0 ? Math.round((dev.speedCount / dev.totalCount) * 100) : 0;
            const sigShare =
              dev.totalCount > 0 ? Math.round((dev.signalCount / dev.totalCount) * 100) : 0;
            const etcShare = Math.max(0, 100 - spdShare - sigShare);
            const share =
              totalSuccess > 0 ? ((dev.totalCount / totalSuccess) * 100).toFixed(1) : '0.0';

            return `<div style="margin-bottom:7px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 8px;background:#ffffff;">
              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
                <span><strong style="color:#0f172a;">${dev.deviceCode}</strong> <span style="color:#64748b;">(점유율 ${share}% · 평균 ${dev.avgSpeed} / 최고 ${dev.maxSpeed}km/h)</span></span>
                <span><strong style="color:#2563eb;">속도 ${dev.speedCount}</strong> · <strong style="color:#e11d48;">신호 ${dev.signalCount}</strong> · <strong>총 ${dev.totalCount}건</strong></span>
              </div>
              <div style="width:100%;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
                <div style="width:${widthPct}%;height:100%;display:flex;border-radius:99px;overflow:hidden;">
                  ${spdShare > 0 ? `<div style="width:${spdShare}%;background:#2563eb;height:100%;"></div>` : ''}
                  ${sigShare > 0 ? `<div style="width:${sigShare}%;background:#e11d48;height:100%;"></div>` : ''}
                  ${etcShare > 0 ? `<div style="width:${etcShare}%;background:#64748b;height:100%;"></div>` : ''}
                </div>
              </div>
            </div>`;
          })
          .join('');

  const deviceRowsHtml =
    report.deviceStats.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:14px;color:#64748b;">집계된 장비 실적이 없습니다.</td></tr>'
      : report.deviceStats
          .map((dev, i) => {
            const share =
              totalSuccess > 0 ? ((dev.totalCount / totalSuccess) * 100).toFixed(1) : '0.0';
            return `<tr>
              <td style="text-align:center;">${i + 1}</td>
              <td style="font-weight:700;color:#0f172a;">${dev.deviceCode}</td>
              <td style="text-align:right;font-weight:700;">${dev.totalCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#1d4ed8;font-weight:600;">${dev.speedCount.toLocaleString()}건</td>
              <td style="text-align:right;color:#e11d48;font-weight:600;">${dev.signalCount.toLocaleString()}건</td>
              <td style="text-align:right;">${dev.avgSpeed} / ${dev.maxSpeed} km/h</td>
              <td style="text-align:right;font-weight:600;">${share}%</td>
            </tr>`;
          })
          .join('');

  const dailyRowsHtml =
    report.dailyStats.length === 0
      ? '<tr><td colspan="5" style="text-align:center;padding:14px;color:#64748b;">집계된 일자별 내역이 없습니다.</td></tr>'
      : report.dailyStats
          .map(
            (d) => `<tr>
              <td style="font-weight:600;">${d.day}</td>
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
  body { font-family: "Malgun Gothic", -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 16px 20px; font-size: 10.5px; line-height: 1.4; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
  .badge { display: inline-block; background: #0f172a; color: #38bdf8; font-weight: 700; font-size: 9.5px; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px; }
  h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
  .meta-table { border-collapse: collapse; font-size: 9.5px; }
  .meta-table td { border: 1px solid #cbd5e1; padding: 2.5px 7px; }
  .meta-table td.lbl { background: #f1f5f9; font-weight: 700; color: #334155; }
  .sec-head { display: flex; justify-content: space-between; align-items: center; margin: 11px 0 5px; }
  h2 { font-size: 12.5px; font-weight: 700; color: #0f172a; padding-left: 7px; border-left: 3px solid #2563eb; }
  .legend { display: flex; gap: 10px; font-size: 9.5px; color: #334155; font-weight: 600; }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 8px; }
  .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; background: #f8fafc; }
  .kpi-box .k-label { font-size: 9.5px; color: #64748b; font-weight: 600; }
  .kpi-box .k-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 1px; }
  .kpi-box .k-sub { font-size: 9px; color: #475569; margin-top: 1px; }
  .chart-card { border: 1px solid #cbd5e1; border-radius: 7px; padding: 8px 10px; background: #f8fafc; }
  .split-charts { display: grid; grid-template-columns: 5fr 7fr; gap: 8px; margin-bottom: 8px; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.data-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 7px; text-align: left; font-weight: 700; color: #334155; }
  table.data-table td { border: 1px solid #cbd5e1; padding: 4px 7px; }
  .footer { margin-top: 14px; padding-top: 7px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="badge">AtoJ 무인교통단속장비 규격 변환기 (v2.1.0)</div>
      <h1>${year}년 ${month}월 무인교통단속 데이터 규격 변환 운영 보고서</h1>
    </div>
    <table class="meta-table">
      <tr><td class="lbl">대상 연월</td><td>${year}년 ${month}월</td><td class="lbl">발행 일자</td><td>${todayStr}</td></tr>
      <tr><td class="lbl">적용 규격</td><td colspan="3">경찰-6310-98-0001 (아규격 → 자규격 .DAT)</td></tr>
      <tr><td class="lbl">기술 지원</td><td colspan="3">㈜ 이노네트웍스 · 강홍선 (s_gain@naver.com)</td></tr>
    </table>
  </div>

  <div class="sec-head">
    <h2>1. 월간 단속 변환 총괄 요약</h2>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box" style="background:#0f172a;color:#ffffff;border-color:#1e293b;">
      <div class="k-label" style="color:#cbd5e1;">월간 정상 변환 완료</div>
      <div class="k-val" style="color:#38bdf8;">${totalSuccess.toLocaleString()}건</div>
      <div class="k-sub" style="color:#94a3b8;">총 처리 ${report.totalProcessed.toLocaleString()}건 (성공률 ${successRate}%)</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">속도위반</div>
      <div class="k-val" style="color:#2563eb;">${speedCount.toLocaleString()}건</div>
      <div class="k-sub">전체 단속 대비 ${speedPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">신호위반</div>
      <div class="k-val" style="color:#e11d48;">${signalCount.toLocaleString()}건</div>
      <div class="k-sub">전체 단속 대비 ${signalPct}%</div>
    </div>
    <div class="kpi-box">
      <div class="k-label">가동 장비 · 위반속도</div>
      <div class="k-val">${report.activeDeviceCount}대</div>
      <div class="k-sub">평균 ${report.avgSpeed}km/h · 최고 ${report.maxSpeed}km/h</div>
    </div>
  </div>

  <div class="sec-head">
    <h2>2. 일자별 단속 변환 추이 차트</h2>
    <div class="legend">
      <span><i class="dot" style="background:#2563eb;"></i> 속도위반 (${speedCount.toLocaleString()}건)</span>
      <span><i class="dot" style="background:#e11d48;"></i> 신호위반 (${signalCount.toLocaleString()}건)</span>
      ${otherCount > 0 ? `<span><i class="dot" style="background:#64748b;"></i> 기타 (${otherCount.toLocaleString()}건)</span>` : ''}
    </div>
  </div>
  <div class="chart-card">${dailyChartHtml}</div>

  <div class="sec-head">
    <h2>3. 위반유형 구성비 및 장비별 비교 분석</h2>
  </div>
  <div class="split-charts">
    <div class="chart-card" style="background:#ffffff;display:flex;align-items:center;justify-content:space-around;padding:10px;">
      <div style="position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center;">
        <svg width="110" height="110" viewBox="0 0 110 110" style="transform:rotate(-90deg);">
          <circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#e2e8f0" stroke-width="14" />
          ${speedLen > 0 ? `<circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#2563eb" stroke-width="14" stroke-dasharray="${speedLen} ${circum}" stroke-dashoffset="0" />` : ''}
          ${signalLen > 0 ? `<circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#e11d48" stroke-width="14" stroke-dasharray="${signalLen} ${circum}" stroke-dashoffset="${-speedLen}" />` : ''}
          ${otherLen > 0 ? `<circle cx="55" cy="55" r="${radius}" fill="transparent" stroke="#64748b" stroke-width="14" stroke-dasharray="${otherLen} ${circum}" stroke-dashoffset="${-(speedLen + signalLen)}" />` : ''}
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:8.5px;color:#64748b;">총 변환</span>
          <span style="font-size:14px;font-weight:800;color:#0f172a;">${totalSuccess.toLocaleString()}</span>
        </div>
      </div>
      <div style="font-size:10px;line-height:1.7;">
        <div><i class="dot" style="background:#2563eb;"></i> <strong>속도위반:</strong> ${speedCount.toLocaleString()}건 (${speedPct}%)</div>
        <div><i class="dot" style="background:#e11d48;"></i> <strong>신호위반:</strong> ${signalCount.toLocaleString()}건 (${signalPct}%)</div>
        ${otherCount > 0 ? `<div><i class="dot" style="background:#64748b;"></i> <strong>기타단속:</strong> ${otherCount.toLocaleString()}건 (${otherPct}%)</div>` : ''}
      </div>
    </div>
    <div class="chart-card">${deviceBarsHtml}</div>
  </div>

  <div class="sec-head">
    <h2>4. 장비번호(LocalNo)별 단속 변환 실적 명세</h2>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:42px;text-align:center;">순위</th>
        <th>장비번호 (LocalNo)</th>
        <th style="text-align:right;">정상 변환 합계</th>
        <th style="text-align:right;">속도위반</th>
        <th style="text-align:right;">신호위반</th>
        <th style="text-align:right;">평균 / 최고속도</th>
        <th style="text-align:right;">점유율</th>
      </tr>
    </thead>
    <tbody>${deviceRowsHtml}</tbody>
  </table>

  <div class="sec-head">
    <h2>5. 일자별 상세 변환 실적 명세</h2>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>단속 일자</th>
        <th style="text-align:right;">정상 변환 합계</th>
        <th style="text-align:right;">속도위반</th>
        <th style="text-align:right;">신호위반</th>
        <th style="text-align:right;">오류 건수</th>
      </tr>
    </thead>
    <tbody>${dailyRowsHtml}</tbody>
  </table>

  <div class="footer">
    <span>프로그램명: AtoJ (무인교통단속장비 규격 변환기 v2.1.0) · 경찰-6310-98-0001 (아규격 → 자규격 .DAT)</span>
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
