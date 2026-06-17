/**
 * Scales and prepares an HTML5 canvas layer for high-precision vector drawing
 */
function prepareCanvasContext(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  return { ctx, W, H };
}

/**
 * Draws a small support triangle vector shape
 */
function drawSupportTriangle(ctx, px, py, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - size, py + size * 1.4);
  ctx.lineTo(px + size, py + size * 1.4);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a load arrowhead vector indicator pointing downward
 */
function drawArrowHead(ctx, px, py, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px, py + 6);
  ctx.lineTo(px - 5, py - 2);
  ctx.lineTo(px + 5, py - 2);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws the complete, detailed Shear Force Diagram (SFD)
 */
export function drawSFD(L, x, Ra, Rb) {
  const setup = prepareCanvasContext('sfd-canvas');
  if (!setup) return;
  const { ctx, W, H } = setup;

  const pad = { top: 28, bot: 36, left: 56, right: 24 };
  const gW  = W - pad.left - pad.right;
  const gH  = H - pad.top  - pad.bot;

  const maxV   = Math.max(Ra, Rb);
  const scaleY = (gH * 0.42) / maxV;
  const baseY  = pad.top + gH / 2;   // Zero axis line

  const xPx = v => pad.left + (v / L) * gW;  
  const vPx = v => baseY - v * scaleY;       

  // ── 1. Grid Lines ──
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (gH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gW, y); ctx.stroke();
  }

  // ── 2. Zero Axis ──
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, baseY); ctx.lineTo(pad.left + gW, baseY); ctx.stroke();

  // ── 3. Beam Baseline & Supports ──
  const beamY = H - pad.bot + 12;
  ctx.strokeStyle = '#4a90d9'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad.left, beamY); ctx.lineTo(pad.left + gW, beamY); ctx.stroke();
  drawSupportTriangle(ctx, pad.left, beamY, 8, '#4a90d9');
  drawSupportTriangle(ctx, pad.left + gW, beamY, 8, '#4a90d9');

  // ── 4. Point Load Force Indicator Arrow at x ──
  const xLoadPx = xPx(x);
  ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xLoadPx, beamY - 28); ctx.lineTo(xLoadPx, beamY - 2); ctx.stroke();
  drawArrowHead(ctx, xLoadPx, beamY - 2, '#f0a500');

  // ── 5. Polygons Fill & Outlines ──
  const yRa    = vPx(Ra);          
  const yNegRb = vPx(-Rb);         
  const xL0    = pad.left;
  const xLEnd  = pad.left + gW;

  ctx.fillStyle = 'rgba(74,220,130,0.18)'; // Positive green fill
  ctx.beginPath(); ctx.moveTo(xL0, baseY); ctx.lineTo(xL0, yRa); ctx.lineTo(xLoadPx, yRa); ctx.lineTo(xLoadPx, baseY); ctx.fill();

  ctx.fillStyle = 'rgba(220,74,74,0.18)';  // Negative red fill
  ctx.beginPath(); ctx.moveTo(xLoadPx, baseY); ctx.lineTo(xLoadPx, yNegRb); ctx.lineTo(xLEnd, yNegRb); ctx.lineTo(xLEnd, baseY); ctx.fill();

  ctx.strokeStyle = '#4adc82'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(xL0, baseY); ctx.lineTo(xL0, yRa); ctx.lineTo(xLoadPx, yRa); ctx.lineTo(xLoadPx, yNegRb); ctx.lineTo(xLEnd, yNegRb); ctx.lineTo(xLEnd, baseY); ctx.stroke();

  // ── 6. Dynamic Annotations Text ──
  ctx.fillStyle = '#4adc82'; ctx.font = 'bold 11px "Share Tech Mono", monospace'; ctx.textAlign = 'left';
  ctx.fillText(`+${(Ra/9810).toFixed(1)} t`, xL0 + 4, yRa - 4);

  ctx.fillStyle = '#dc4a4a'; ctx.textAlign = 'right';
  ctx.fillText(`−${(Rb/9810).toFixed(1)} t`, xLEnd - 4, yNegRb + 12);

  ctx.fillStyle = '#f0a500'; ctx.font = '10px "Barlow", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`x = ${(x/1000).toFixed(2)} m`, xLoadPx, beamY - 32);

  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillText('V (kN)', pad.left - 28, pad.top + gH / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.textAlign = 'left'; ctx.fillText('0', pad.left, H - pad.bot + 26);
  ctx.textAlign = 'right'; ctx.fillText(`${(L/1000).toFixed(1)} m`, pad.left + gW, H - pad.bot + 26);

  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 10px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SHEAR FORCE DIAGRAM', W / 2, pad.top - 8);
}

/**
 * Draws the complete, detailed Bending Moment Diagram (BMD)
 */
export function drawBMD(L, x, Mmax) {
  const setup = prepareCanvasContext('bmd-canvas');
  if (!setup) return;
  const { ctx, W, H } = setup;

  const pad = { top: 28, bot: 36, left: 56, right: 24 };
  const gW  = W - pad.left - pad.right;
  const gH  = H - pad.top  - pad.bot;

  const scaleY = (gH * 0.78) / Mmax;
  const baseY  = pad.top + gH;          
  const xPx    = v => pad.left + (v / L) * gW;
  const mPx    = v => baseY - v * scaleY;  

  // ── 1. Grid lines ──
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (gH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + gW, y); ctx.stroke();
  }

  // ── 2. Zero Axis ──
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, baseY); ctx.lineTo(pad.left + gW, baseY); ctx.stroke();

  // ── 3. Beam Baseline & Supports ──
  const beamY = H - pad.bot + 12;
  ctx.strokeStyle = '#4a90d9'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad.left, beamY); ctx.lineTo(pad.left + gW, beamY); ctx.stroke();
  drawSupportTriangle(ctx, pad.left, beamY, 8, '#4a90d9');
  drawSupportTriangle(ctx, pad.left + gW, beamY, 8, '#4a90d9');

  // ── 4. Dynamic Force Arrow Indicator (Fixed from W/2 to real x position) ──
  const xLoadPx = xPx(x);
  ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xLoadPx, beamY - 28); ctx.lineTo(xLoadPx, beamY - 2); ctx.stroke();
  drawArrowHead(ctx, xLoadPx, beamY - 2, '#f0a500');

  // ── 5. Parabolic exact moment distributions loops calculation ──
  const nPts = 80;
  const exactPts = [];
  const RaV = Mmax / x;
  const RbV = Mmax / (L - x);
  for (let i = 0; i <= nPts; i++) {
    const s = (i / nPts) * L;
    const m = s <= x ? RaV * s : RbV * (L - s);
    exactPts.push({ s, m });
  }

  // ── 6. Moment Polygons Fill & Outline ──
  ctx.fillStyle = 'rgba(160,100,240,0.18)'; 
  ctx.beginPath(); ctx.moveTo(pad.left, baseY);
  for (const p of exactPts) ctx.lineTo(xPx(p.s), mPx(p.m));
  ctx.lineTo(pad.left + gW, baseY); ctx.fill();

  ctx.strokeStyle = '#a064f0'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(pad.left, baseY);
  for (const p of exactPts) ctx.lineTo(xPx(p.s), mPx(p.m));
  ctx.lineTo(pad.left + gW, baseY); ctx.stroke();

  // ── 7. Dashed Peak drop lines & text captions (Fixed from W/2 to xLoadPx) ──
  const yPeak = mPx(Mmax);
  ctx.setLineDash([3, 3]); // Re-added your original 3px dashed array look
  ctx.strokeStyle = 'rgba(160,100,240,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xLoadPx, yPeak); ctx.lineTo(xLoadPx, baseY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#a064f0'; ctx.font = 'bold 11px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${(Mmax/1e6).toFixed(1)} kN·m`, xLoadPx, yPeak - 6);

  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px "Barlow", sans-serif';
  ctx.fillText('M (kN·m)', pad.left - 28, pad.top + gH / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.textAlign = 'left'; ctx.fillText('0', pad.left, H - pad.bot + 26);
  ctx.textAlign = 'right'; ctx.fillText(`${(L/1000).toFixed(1)} m`, pad.left + gW, H - pad.bot + 26);
  ctx.fillStyle = '#f0a500'; ctx.textAlign = 'center'; ctx.fillText(`x = ${(x/1000).toFixed(2)} m`, xLoadPx, beamY - 32);

  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = 'bold 10px "Barlow Condensed", sans-serif';
  ctx.fillText('BENDING MOMENT DIAGRAM', W / 2, pad.top - 8);
}
