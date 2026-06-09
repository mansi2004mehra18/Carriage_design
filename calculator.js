/**
 * ═══════════════════════════════════════════════════════════
 *  CARRIAGE BEAM DESIGN CALCULATOR
 *  Ported from: carriage_beam_solver.py
 *
 *  Material  : IS 2062 Grade E250 BR
 *  Section   : Hollow rectangular box, height H (user-defined)
 *  Loading   : Simply supported beam, central point load P
 *  Failure   : Pure bending | Von Mises | Tresca (governing)
 *  Breadth   : Solved via closed-form inversion of I_xx
 *
 *  b(t) = [12·I_req − 2t·(H−2t)³] / [H³ − (H−2t)³]
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

// ── Physical / Material Constants ────────────────────────
const SY          = 250;       // Yield strength, MPa  (IS 2062 E250)
const FOS         = 1.25;      // Factor of Safety
const G           = 9810;      // N per tonne
const E_STEEL     = 210000;    // Young's modulus, N/mm²
const TAU_ALL_TR  = SY / (2 * FOS);   // Tresca shear allowable = 100 MPa


// ════════════════════════════════════════════════════════
//  CALCULATION ENGINE
// ════════════════════════════════════════════════════════

/**
 * Closed-form inversion of hollow-rectangle second moment of area.
 *
 * I_xx = (B·H³ − bi·hi³) / 12
 *       = B·[H³ − (H−2t)³]/12  +  2t·(H−2t)³/12
 *
 * Solving for B:
 *   b(t) = [12·I_req − 2t·(H−2t)³] / [H³ − (H−2t)³]
 *
 * A negative result means the web alone exceeds I_req – physically
 * valid but flagged; minimum practical B = 2t should be used.
 *
 * @param {number} I_req  Required second moment of area (mm⁴)
 * @param {number} t      Wall thickness (mm)
 * @param {number} H      Section outer height (mm)
 * @returns {number}      Required flange width B (mm); may be negative or Infinity
 */
function solveBDirect(I_req, t, H) {
  const hi    = H - 2 * t;
  const denom = H ** 3 - hi ** 3;
  if (denom === 0) return Infinity;
  const numerator = 12 * I_req - 2 * t * hi ** 3;
  return numerator / denom;
}


/**
 * Elastic section modulus Z = I_xx / (H/2) for a hollow rectangle.
 *
 * @param {number} B  Outer flange width (mm)
 * @param {number} t  Wall thickness (mm)
 * @param {number} H  Section outer height (mm)
 * @returns {number}  Section modulus (mm³)
 */
function sectionModulus(B, t, H) {
  const bi = B - 2 * t;
  const hi = H - 2 * t;
  if (bi <= 0 || hi <= 0) return 0;
  const I_xx = (B * H ** 3 - bi * hi ** 3) / 12;
  return I_xx / (H / 2);
}


/**
 * Full design calculation for a given span, thickness, load, and height.
 * Returns every intermediate and final value needed for display.
 *
 * @param {number} L        Span between wheels (mm)
 * @param {number} t        Wall thickness (mm)
 * @param {number} P_tonnes Applied central load (tonnes)
 * @param {number} H        Section outer height (mm)
 * @returns {Object}        Result dictionary
 */
function calc(L, t, P_tonnes, H) {

  // ── Basic loading ──────────────────────────────────────
  const P_N   = P_tonnes * G;          // Load in Newtons
  const M_max = P_N * L / 4;           // Max bending moment, N·mm (central point load)
  const V_max = P_N / 2;               // Max shear force, N
  const hi    = H - 2 * t;             // Inner height, mm
  const A_w   = 2 * t * H;             // Web shear area (both webs), mm²
  const tau   = V_max / A_w;           // Average shear stress in web, MPa

  // ── Allowable bending stress (thickness-dependent per IS 2062) ──
  let S_ALL;
  if      (t <= 20) S_ALL = 250 / 1.2;   // 208.33 MPa
  else if (t <= 40) S_ALL = 240 / 1.2;   // 200.00 MPa
  else              S_ALL = 230 / 1.2;   // 191.67 MPa

  // ── Theory 1: Pure bending ──────────────────────────────
  // I_req = M·(H/2) / σ_all
  const I_req_bend = M_max * (H / 2) / S_ALL;
  const B_bend     = solveBDirect(I_req_bend, t, H);

  // ── Theory 2: Von Mises ─────────────────────────────────
  // σ_vm = √(σ_b² + 3τ²) ≤ S_ALL  →  σ_b_allow = √(S_ALL² - 3τ²)
  const disc_vm = S_ALL ** 2 - 3 * tau ** 2;
  let s_allow_vm, I_req_vm, B_vm;
  if (disc_vm <= 0) {
    s_allow_vm = 0;
    I_req_vm   = Infinity;
    B_vm       = Infinity;
  } else {
    s_allow_vm = Math.sqrt(disc_vm);
    I_req_vm   = M_max * (H / 2) / s_allow_vm;
    B_vm       = solveBDirect(I_req_vm, t, H);
  }

  // ── Theory 3: Tresca ────────────────────────────────────
  // τ_max = √((σ_b/2)² + τ²) ≤ TAU_ALL_TR
  //   →  σ_b_allow = 2·√(TAU_ALL_TR² − τ²)
  const disc_tr = TAU_ALL_TR ** 2 - tau ** 2;
  let s_allow_tr, I_req_tr, B_tr;
  if (disc_tr <= 0) {
    s_allow_tr = 0;
    I_req_tr   = Infinity;
    B_tr       = Infinity;
  } else {
    s_allow_tr = 2 * Math.sqrt(disc_tr);
    I_req_tr   = M_max * (H / 2) / s_allow_tr;
    B_tr       = solveBDirect(I_req_tr, t, H);
  }

  // ── Governing: take most demanding (max B) ──────────────
  const B_gov     = Math.max(B_bend, B_vm, B_tr);
  // Round up to nearest 5 mm
  const B_des_raw = B_gov > 0 ? Math.ceil(B_gov / 5) * 5 : B_gov;

  // ── Final section properties (only when B is positive) ──
  let B_des, I_xx, Z_des, sig_b, sig_vm, tau_max;
  if (B_gov > 0) {
    B_des        = Math.round(B_des_raw);
    Z_des        = sectionModulus(B_des, t, H);
    const bi_des = B_des - 2 * t;
    I_xx         = (B_des * H ** 3 - bi_des * hi ** 3) / 12;
    sig_b        = Z_des > 0 ? M_max / Z_des : Infinity;
    sig_vm       = Math.sqrt(sig_b ** 2 + 3 * tau ** 2);
    tau_max      = Math.sqrt((sig_b / 2) ** 2 + tau ** 2);
  } else {
    B_des = B_gov;                                    // keep negative for reporting
    I_xx = Z_des = sig_b = sig_vm = tau_max = NaN;
  }

  // ── Midspan deflection: δ = PL³ / (48·E·I) ─────────────
  // Uses I based on the pure-bending design breadth B_bend
  let defl;
  if (B_bend > 0) {
    const hi_b   = H - 2 * t;
    const I_defl = (B_bend * H ** 3 - (B_bend - 2 * t) * hi_b ** 3) / 12;
    defl = (P_N * L ** 3) / (48 * E_STEEL * I_defl);
  } else {
    defl = NaN;
  }

  return {
    // Loading
    P_N, M_max, V_max,
    // Section geometry
    hi, A_w, tau,
    // Allowable stress
    S_ALL,
    // Theory 1 – Pure Bending
    I_req_bend, B_bend,
    // Theory 2 – Von Mises
    s_allow_vm, I_req_vm, B_vm,
    // Theory 3 – Tresca
    s_allow_tr, I_req_tr, B_tr,
    // Governing design
    B_gov, B_des,
    // Section properties (NaN if infeasible)
    I_xx, Z_des,
    // Stress verification
    sig_b, sig_vm, tau_max,
    // Deflection
    defl
  };
}


// ════════════════════════════════════════════════════════
//  UI HELPER FUNCTIONS
// ════════════════════════════════════════════════════════

/**
 * Set innerHTML of element by id.
 * @param {string} id
 * @param {string} val
 */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

/**
 * Format a number to fixed decimal places; returns '—' for NaN/Infinity.
 * @param {number} v
 * @param {number} [d=2]
 * @returns {string}
 */
function fN(v, d = 2) {
  return (isNaN(v) || !isFinite(v)) ? '—' : v.toFixed(d);
}

/**
 * Format a B value: red span for negative or infinity, plain for valid.
 * @param {number} v
 * @returns {string} HTML string
 */
function fB(v) {
  if (!isFinite(v)) return '<span class="neg">∞</span>';
  if (v < 0)        return `<span class="neg">${v.toFixed(1)}*</span>`;
  return v.toFixed(1);
}

/**
 * Return a SAFE or FAIL pill HTML string.
 * @param {boolean} ok
 * @returns {string}
 */
function statusPill(ok) {
  return ok
    ? '<span class="pill pass">✓ SAFE</span>'
    : '<span class="pill fail">✗ FAIL</span>';
}

/**
 * Return feasibility pill for sweep table.
 * @param {number} B_des
 * @returns {string}
 */
function feasCell(B_des) {
  if (B_des <= 0 || isNaN(B_des)) return '<span class="pill fail">NEG</span>';
  return '<span class="pill pass">YES</span>';
}

/**
 * Determine the governing theory name from B values.
 * @param {Object} r  Result object from calc()
 * @returns {string}
 */
function governingTheory(r) {
  if (r.B_gov === r.B_tr  && isFinite(r.B_tr))  return 'Tresca';
  if (r.B_gov === r.B_vm  && isFinite(r.B_vm))  return 'Von Mises';
  return 'Pure Bending';
}


// ════════════════════════════════════════════════════════
//  MAIN CALCULATE — reads inputs, runs calc(), updates DOM
// ════════════════════════════════════════════════════════

function runCalc() {

  const errBanner = document.getElementById('error-banner');
  errBanner.classList.add('hidden');

  // ── Read inputs ────────────────────────────────────────
  const L        = parseFloat(document.getElementById('inp-L').value);
  const t        = parseFloat(document.getElementById('inp-t').value);
  const P_tonnes = parseFloat(document.getElementById('inp-P').value);
  const H        = parseFloat(document.getElementById('inp-H').value);

  // ── Validate ───────────────────────────────────────────
  const errs = [];
  if (isNaN(L) || L < 500)
    errs.push('Span L must be ≥ 500 mm.');
  if (isNaN(t) || t < 8)
    errs.push('Thickness t must be ≥ 8 mm.');
  if (isNaN(H) || H < 100)
    errs.push('Section height H must be ≥ 100 mm.');
  if (!isNaN(t) && !isNaN(H) && 2 * t >= H)
    errs.push(`t = ${t} mm makes inner height ≤ 0. Choose t < ${H / 2} mm.`);
  if (isNaN(P_tonnes) || P_tonnes < 0.1)
    errs.push('Load P must be ≥ 0.1 tonnes.');

  if (errs.length) {
    errBanner.innerHTML = errs.map(e => '⚠ ' + e).join('<br>');
    errBanner.classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    return;
  }

  // ── Run engine ─────────────────────────────────────────
  const r = calc(L, t, P_tonnes, H);
  const feasible = r.B_gov > 0 && !isNaN(r.B_des);

  // ── Section 0: Feasibility hero ───────────────────────
  const hero = document.getElementById('feasibility-hero');
  hero.className = 'feasibility-hero ' + (feasible ? 'feas-ok' : 'feas-ng');
  set('feas-icon',  feasible ? '✓' : '✗');
  set('feas-title', feasible ? 'FEASIBLE DESIGN' : 'NOT FEASIBLE');
  set('feas-sub',   feasible
    ? `Governing criterion: ${governingTheory(r)}`
    : `B is negative — web section alone satisfies I<sub>req</sub>. Use B ≥ 2t = ${2 * t} mm.`);
  set('feas-B', feasible
    ? `B<sub>design</sub> = <strong>${r.B_des}</strong> mm`
    : `Min practical B ≥ 2t = ${2 * t} mm`);

  // ── Section KPI strip ──────────────────────────────────
  set('kpi-B',    `<div class="kpi-val">${feasible ? r.B_des : '—'}</div><div class="kpi-lbl">Design B (mm)</div>`);
  set('kpi-Ixx',  `<div class="kpi-val">${feasible ? (r.I_xx / 1e9).toFixed(4) : '—'}</div><div class="kpi-lbl">I<sub>xx</sub> (×10⁹ mm⁴)</div>`);
  set('kpi-Z',    `<div class="kpi-val">${feasible ? (r.Z_des / 1e6).toFixed(4) : '—'}</div><div class="kpi-lbl">Z (×10⁶ mm³)</div>`);
  set('kpi-defl', `<div class="kpi-val">${isNaN(r.defl) ? '—' : r.defl.toFixed(3)}</div><div class="kpi-lbl">δ midspan (mm)</div>`);

  // ── Section 02: Loading analysis ───────────────────────
  set('d-PN',    `${(r.P_N / 1000).toFixed(2)} kN`);
  set('d-Vmax',  `${(r.V_max / 1000).toFixed(2)} kN`);
  set('d-Mmax',  `${(r.M_max / 1e6).toFixed(3)} kN·m`);
  set('d-Sall',  `${r.S_ALL.toFixed(2)} MPa`);

  // ── Section 03: Section geometry ───────────────────────
  set('d-hi',     `${r.hi.toFixed(1)} mm`);
  set('d-Aw',     `${r.A_w.toFixed(1)} mm²`);
  set('d-tau',    `${r.tau.toFixed(4)} MPa`);
  set('d-tauall', `${TAU_ALL_TR.toFixed(2)} MPa`);

  // ── Section 04: Failure theories ───────────────────────
  // Pure bending
  set('th-sall-bend',  r.S_ALL.toFixed(2));
  set('th-Ireq-bend',  (r.I_req_bend / 1e9).toFixed(4));
  set('th-B-bend',     fB(r.B_bend));
  set('th-st-bend',    r.B_bend > 0
    ? '<span class="pill pass">OK</span>'
    : '<span class="pill info">NEG</span>');

  // Von Mises
  set('th-sall-vm',    r.s_allow_vm > 0 ? r.s_allow_vm.toFixed(4) : '—');
  set('th-Ireq-vm',    isFinite(r.I_req_vm) ? (r.I_req_vm / 1e9).toFixed(4) : '∞');
  set('th-B-vm',       fB(r.B_vm));
  set('th-st-vm',      r.B_vm > 0 && isFinite(r.B_vm)
    ? '<span class="pill pass">OK</span>'
    : '<span class="pill info">NEG/∞</span>');

  // Tresca
  set('th-sall-tr',    r.s_allow_tr > 0 ? r.s_allow_tr.toFixed(4) : '—');
  set('th-Ireq-tr',    isFinite(r.I_req_tr) ? (r.I_req_tr / 1e9).toFixed(4) : '∞');
  set('th-B-tr',       fB(r.B_tr));
  set('th-st-tr',      r.B_tr > 0 && isFinite(r.B_tr)
    ? '<span class="pill pass">OK</span>'
    : '<span class="pill info">NEG/∞</span>');

  // ── Section 05: Stress verification ────────────────────
  const stressSec = document.getElementById('stress-section');
  if (feasible) {
    stressSec.style.display = '';

    set('sv-sigb',     fN(r.sig_b, 3));
    set('sv-sigb-lim', r.S_ALL.toFixed(2));
    set('sv-sigb-ok',  statusPill(r.sig_b <= r.S_ALL + 0.05));

    set('sv-tau',      fN(r.tau, 4));
    set('sv-tau-lim',  TAU_ALL_TR.toFixed(2));
    set('sv-tau-ok',   statusPill(r.tau <= TAU_ALL_TR + 0.05));

    set('sv-vm',       fN(r.sig_vm, 3));
    set('sv-vm-lim',   r.S_ALL.toFixed(2));
    set('sv-vm-ok',    statusPill(r.sig_vm <= r.S_ALL + 0.05));

    set('sv-tr',       fN(r.tau_max, 3));
    set('sv-tr-lim',   TAU_ALL_TR.toFixed(2));
    set('sv-tr-ok',    statusPill(r.tau_max <= TAU_ALL_TR + 0.05));
  } else {
    stressSec.style.display = 'none';
  }

  // ── Section 06: Sweep table (t = 8 to 63) ─────────────
  const tbody = document.getElementById('sweep-body');
  tbody.innerHTML = '';

  for (let tv = 8; tv <= 63; tv++) {
    if (2 * tv >= H) break;                          // skip physically invalid rows
    const rv = calc(L, tv, P_tonnes, H);
    const isCurrentT = tv === t;

    const bDesStr = (rv.B_des > 0 && !isNaN(rv.B_des))
      ? Math.round(rv.B_des)
      : '<span class="neg">NEG</span>';
    const deflStr = isNaN(rv.defl)   ? '—' : rv.defl.toFixed(4);
    const sigbStr = isNaN(rv.sig_b)  ? '—' : rv.sig_b.toFixed(2);

    const row = document.createElement('tr');
    if (isCurrentT) row.className = 'highlight-row';
    row.innerHTML = `
      <td>${tv}</td>
      <td>${fB(rv.B_bend)}</td>
      <td>${fB(rv.B_vm)}</td>
      <td>${fB(rv.B_tr)}</td>
      <td>${bDesStr}</td>
      <td>${sigbStr}</td>
      <td>${rv.tau.toFixed(4)}</td>
      <td>${deflStr}</td>
      <td>${feasCell(rv.B_des)}</td>`;
    tbody.appendChild(row);
  }

  // ── Show results & scroll ──────────────────────────────
  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════

// Enter key triggers calculation from anywhere on the page
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') runCalc();
});

// Run with default values on first load
window.addEventListener('load', runCalc);
