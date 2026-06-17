export function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

export function fN(v, d = 2) {
  return (isNaN(v) || !isFinite(v)) ? '—' : v.toFixed(d);
}

export function fB(v) {
  if (!isFinite(v)) return '<span class="neg">∞</span>';
  if (v < 0)        return `<span class="neg">${v.toFixed(1)}*</span>`;
  return v.toFixed(1);
}

export function statusPill(ok) {
  return ok
    ? '<span class="pill pass">✓ SAFE</span>'
    : '<span class="pill fail">✗ FAIL</span>';
}

export function feasCell(B_des) {
  if (B_des <= 0 || isNaN(B_des)) return '<span class="pill fail">NEG</span>';
  return '<span class="pill pass">YES</span>';
}

export function governingTheory(r) {
  if (r.B_gov === r.B_tr  && isFinite(r.B_tr))  return 'Tresca';
  if (r.B_gov === r.B_vm  && isFinite(r.B_vm))  return 'Von Mises';
  return 'Pure Bending';
}
