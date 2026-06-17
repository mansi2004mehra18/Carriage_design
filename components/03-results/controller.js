import { set, fN, governingTheory } from '../../shared/ui-helpers.js';

/**
 * Pushes calculated intermediate variables out onto the primary dashboard layout section
 */
export function updateResultsUI(r, inputs) {
  const feasible = r.B_gov > 0 && !isNaN(r.B_des);
  const heroElement = document.getElementById('feasibility-hero');
  
  if (heroElement) {
    heroElement.className = 'feasibility-hero ' + (feasible ? 'feas-ok' : 'feas-ng');
  }

  // 1. Populate the Feasibility Hero Banner Status text blocks safely
  set('feas-icon',  feasible ? '✓' : '✗');
  set('feas-title', feasible ? 'FEASIBLE DESIGN' : 'NOT FEASIBLE');
  set('feas-sub',   feasible
    ? `Governing criterion: ${governingTheory(r)}`
    : `B is negative — web section alone satisfies I_req. Use B ≥ 2t₁ = ${2 * inputs.t1} mm.`);
  set('feas-B', feasible
    ? `B<sub>design</sub> = <strong>${r.B_des}</strong> mm`
    : `Min practical B ≥ 2t₁ = ${2 * inputs.t1} mm`);

  // 2. Populate ONLY the inner value containers of the KPI strip to keep layout intact
  const bValEl = document.querySelector('#kpi-B .kpi-val');
  const ixxValEl = document.querySelector('#kpi-Ixx .kpi-val');
  const zValEl = document.querySelector('#kpi-Z .kpi-val');
  const deflValEl = document.querySelector('#kpi-defl .kpi-val');

  if (bValEl) bValEl.innerHTML = feasible ? r.B_des : '—';
  if (ixxValEl) ixxValEl.innerHTML = feasible ? (r.I_xx / 1e9).toFixed(4) : '—';
  if (zValEl) zValEl.innerHTML = feasible ? (r.Z_des / 1e6).toFixed(4) : '—';
  if (deflValEl) deflValEl.innerHTML = isNaN(r.defl) ? '—' : r.defl.toFixed(3);

  // 3. Populate Section 02: Loading Analysis data rows using calculated keys
  set('d-PN',    `${(r.P_N / 1000).toFixed(2)} kN`);
  set('d-Ra',    `${(r.R_A / 1000).toFixed(2)} kN`);
  set('d-Rb',    `${(r.R_B / 1000).toFixed(2)} kN`);
  set('d-Mmax',  `${(r.M_max / 1e6).toFixed(3)} kN·m`);
  set('d-Vmax',  `${(r.V_max / 1000).toFixed(2)} kN`);
  set('d-Sall',  `${r.S_ALL.toFixed(2)} MPa`);

  // 4. Populate Section 03: Section Geometry data rows using calculated keys
  set('d-hi',     `${r.hi.toFixed(1)} mm`);
  set('d-bi',     feasible ? `${(r.B_des - 2 * inputs.t1).toFixed(1)} mm` : '—');
  set('d-Aw',     `${r.A_w.toFixed(1)} mm²`);
  set('d-tau',    `${r.tau.toFixed(4)} MPa`);
  set('d-tauall', `${r.TAU_ALL_TR.toFixed(2)} MPa`);
}
