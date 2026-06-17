// ── Section Visualisation renderer ───────────────────────────
export function drawSectionVis() {
  // Safe extraction fallbacks if runtime calculation fields parse as empty strings
  const Hv = parseFloat(document.getElementById("inp-H")?.value) || 850;
  const t1v = parseFloat(document.getElementById("inp-t1")?.value) || 12;
  const t2v = parseFloat(document.getElementById("inp-t2")?.value) || 25;
  const t3v = parseFloat(document.getElementById("inp-t3")?.value) || 25;
  const Lv = parseFloat(document.getElementById("inp-L")?.value) || 7800;
  
  const Braw = parseFloat(
    document.getElementById("kpi-B")?.querySelector(".kpi-val")?.textContent
  );
  const Bv = isFinite(Braw) && Braw > 0 ? Braw : Math.round((Hv * 0.55) / 5) * 5;

  const csCanvas = document.getElementById("cs-canvas");
  const elCanvas = document.getElementById("el-canvas");

  // Prevent script evaluation errors if layout view sections are contextually hidden
  if (csCanvas) {
    drawCrossSection(csCanvas, Bv, Hv, t1v, t2v, t3v);
  }
  if (elCanvas) {
    drawBeamElevation(elCanvas, Lv, Hv);
  }
}

export function _csSetup(canvas) {
  const dpr = window.devicePixelRatio || 1;
  
  // FIX: Protect coordinates from initializing as 0 if browser rendering drops frames
  const W = canvas.offsetWidth > 0 ? canvas.offsetWidth : 420;
  const H = canvas.offsetHeight > 0 ? canvas.offsetHeight : 300;
  
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  return { ctx, W, H };
}

export function drawCrossSection(canvas, B, H, t1, t2, t3) {
  const { ctx, W: CW, H: CH } = _csSetup(canvas);

  const pad = 42;
  const scaleX = (CW - pad * 2) / B;
  const scaleY = (CH - pad * 2) / H;
  const sc = Math.min(scaleX, scaleY);

  const drawW = B * sc;
  const drawH = H * sc;
  const ox = (CW - drawW) / 2;
  const oy = (CH - drawH) / 2;

  const bi = B - 2 * t1;
  const hi = H - t2 - t3;
  const biD = bi * sc;
  const hiD = hi * sc;
  const ixO = ox + t1 * sc;
  const iyO = oy + t2 * sc;

  ctx.fillStyle = "rgba(74,144,217,0.22)";
  ctx.fillRect(ox, oy, drawW, drawH);

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  if (bi > 0 && hi > 0) ctx.fillRect(ixO, iyO, biD, hiD);
  ctx.restore();

  ctx.strokeStyle = "#4a90d9";
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, drawW, drawH);

  if (bi > 0 && hi > 0) {
    ctx.strokeStyle = "rgba(74,144,217,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ixO, iyO, biD, hiD);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const cx = ox + drawW / 2, cy = oy + drawH / 2;
  ctx.beginPath();
  ctx.moveTo(ox - 8, cy);
  ctx.lineTo(ox + drawW + 8, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, oy - 8);
  ctx.lineTo(cx, oy + drawH + 8);
  ctx.stroke();
  ctx.setLineDash([]);

  const DIM_COL = "#f0a500";
  const DIM_INNER = "rgba(255,255,255,0.45)";
  const FONT_DIM = 'bold 10px "Share Tech Mono", monospace';
  const FONT_SMALL = '9px "Share Tech Mono", monospace';

  _dimLine(ctx, ox, oy - 14, ox + drawW, oy - 14, DIM_COL);
  ctx.fillStyle = DIM_COL;
  ctx.font = FONT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(`B = ${Math.round(B)} mm`, cx, oy - 18);

  _dimLineV(ctx, ox + drawW + 16, oy, ox + drawW + 16, oy + drawH, DIM_COL);
  ctx.save();
  ctx.translate(ox + drawW + 30, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = DIM_COL;
  ctx.font = FONT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(`H = ${Math.round(H)} mm`, 0, 0);
  ctx.restore();

  if (bi > 0 && hi > 0) {
    const iyBot = iyO + hiD;
    _dimLine(ctx, ixO, iyBot + 10, ixO + biD, iyBot + 10, DIM_INNER);
    ctx.fillStyle = DIM_INNER;
    ctx.font = FONT_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(`b−2t₁ = ${Math.round(bi)}`, cx, iyBot + 22);

    _dimLineV(ctx, ixO - 12, iyO, ixO - 12, iyO + hiD, DIM_INNER);
    ctx.save();
    ctx.translate(ixO - 24, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = DIM_INNER;
    ctx.font = FONT_SMALL;
    ctx.textAlign = "center";
    ctx.fillText(`h−t₂−t₃ = ${Math.round(hi)}`, 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(240,165,0,0.7)";
  ctx.font = '9px "Share Tech Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillText(`t₁=${t1}`, ox + 2, cy - 3);
  ctx.textAlign = "center";
  ctx.fillText(`t₂=${t2}`, cx, oy + t2 * sc * 0.5 + 4);
  ctx.fillText(`t₃=${t3}`, cx, oy + drawH - t3 * sc * 0.4);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = 'bold 9px "Barlow Condensed", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("CROSS-SECTION", CW / 2, CW < 200 ? 10 : 12);
}

export function drawBeamElevation(canvas, L, H) {
  const { ctx, W: CW, H: CH } = _csSetup(canvas);

  const pad = { top: 44, bot: 54, left: 44, right: 44 };
  const gW = CW - pad.left - pad.right;
  const gH = CH - pad.top - pad.bot;

  const scX = gW / L;
  const scY = Math.min(gH, H * scX * 6) / (H * 6);
  const sc = Math.min(scX, scY);

  const drawL = L * sc;
  const drawH = Math.max(H * sc, 14);
  const ox = (CW - drawL) / 2;
  const oy = CH / 2 - drawH / 2;

  ctx.fillStyle = "rgba(74,144,217,0.20)";
  ctx.fillRect(ox, oy, drawL, drawH);
  ctx.strokeStyle = "#4a90d9";
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, drawL, drawH);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, oy + drawH / 2);
  ctx.lineTo(ox + drawL, oy + drawH / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const beamBot = oy + drawH;
  const wR = Math.max(10, Math.min(18, drawH * 0.45));
  const wY = beamBot + wR + 2;
  [
    [ox, "A"],
    [ox + drawL, "B"],
  ].forEach(([wx, lbl]) => {
    ctx.beginPath();
    ctx.arc(wx, wY, wR, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(240,165,0,0.18)";
    ctx.fill();
    ctx.strokeStyle = "#f0a500";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(240,165,0,0.5)";
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * wR * 0.85, wY + Math.sin(a) * wR * 0.85);
      ctx.lineTo(wx - Math.cos(a) * wR * 0.85, wY - Math.sin(a) * wR * 0.85);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(240,165,0,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx - wR - 4, wY + wR);
    ctx.lineTo(wx + wR + 4, wY + wR);
    ctx.stroke();
    ctx.fillStyle = "#f0a500";
    ctx.font = 'bold 10px "Share Tech Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText(`R${lbl}`, wx, wY + wR + 13);
  });

  const dimY = wY + wR + 22;
  _dimLine(ctx, ox, dimY, ox + drawL, dimY, "#f0a500");
  ctx.fillStyle = "#f0a500";
  ctx.font = 'bold 10px "Share Tech Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText(
    `L = ${(L / 1000).toFixed(2)} m  (${Math.round(L)} mm)`,
    CW / 2,
    dimY + 12,
  );

  _dimLineV(ctx, ox + drawL + 16, oy, ox + drawL + 16, oy + drawH, "#4a90d9");
  ctx.save();
  ctx.translate(ox + drawL + 30, oy + drawH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#4a90d9";
  ctx.font = 'bold 10px "Share Tech Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText(`H = ${Math.round(H)} mm`, 0, 0);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = 'bold 9px "Barlow Condensed", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("BEAM ELEVATION — WHEEL TO WHEEL", CW / 2, 12);
}

export function _dimLine(ctx, x1, y, x2, y2, color) {
  const yy = y;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, yy);
  ctx.lineTo(x2, yy);
  ctx.stroke();
  [x1, x2].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, yy - 4);
    ctx.lineTo(x, yy + 4);
    ctx.stroke();
  });
}

export function _dimLineV(ctx, x, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  [y1, y2].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
  });
}

// FIX: Event listener attachment deferment structure block
window.addEventListener("DOMContentLoaded", () => {
  ["inp-H", "inp-t1", "inp-t2", "inp-t3", "inp-L"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", drawSectionVis);
  });

  const _origRunCalc = window.runCalc;
  window.runCalc = function () {
    if (_origRunCalc) _origRunCalc.apply(this, arguments);
    setTimeout(drawSectionVis, 50);
  };

  setTimeout(drawSectionVis, 80);
});

window.addEventListener("resize", drawSectionVis);
