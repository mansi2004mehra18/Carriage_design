import { set, fB } from '../../shared/ui-helpers.js';

/**
 * Re-renders the Failure Theories required breadths matrix comparison data
 */
export function renderTheoriesTable(r) {
  // 1. Pure Bending Row Cell Data
  set('th-sall-bend',  r.S_ALL.toFixed(2));
  set('th-Ireq-bend',  (r.I_req_bend / 1e9).toFixed(4));
  set('th-B-bend',     fB(r.B_bend));
  set('th-st-bend',    r.B_bend > 0 ? '<span class="pill pass">OK</span>' : '<span class="pill info">NEG</span>');

  // 2. Von Mises Row Cell Data
  set('th-sall-vm',    r.s_allow_vm > 0 ? r.s_allow_vm.toFixed(4) : '—');
  set('th-Ireq-vm',    isFinite(r.I_req_vm) ? (r.I_req_vm / 1e9).toFixed(4) : '&infin;');
  set('th-B-vm',       fB(r.B_vm));
  set('th-st-vm',      r.B_vm > 0 && isFinite(r.B_vm) ? '<span class="pill pass">OK</span>' : '<span class="pill info">NEG/&infin;</span>');

  // 3. Tresca Row Cell Data
  set('th-sall-tr',    r.s_allow_tr > 0 ? r.s_allow_tr.toFixed(4) : '—');
  set('th-Ireq-tr',    isFinite(r.I_req_tr) ? (r.I_req_tr / 1e9).toFixed(4) : '&infin;');
  set('th-B-tr',       fB(r.B_tr));
  set('th-st-tr',      r.B_tr > 0 && isFinite(r.B_tr) ? '<span class="pill pass">OK</span>' : '<span class="pill info">NEG/&infin;</span>');
}
