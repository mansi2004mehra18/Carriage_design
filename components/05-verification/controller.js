import { set, fN, statusPill } from '../../shared/ui-helpers.js';

/**
 * Updates the stress safety verification rows inside the compliance panel
 */
export function renderStressVerification(r) {
  const stressSec = document.getElementById('stress-section');
  if (!stressSec) return;

  if (r.B_gov > 0 && !isNaN(r.B_des)) {
    stressSec.style.display = '';
    
    // 1. Pure Bending Stress verification line
    set('sv-sigb',     fN(r.sig_b, 3));
    set('sv-sigb-lim', r.S_ALL.toFixed(2));
    set('sv-sigb-ok',  statusPill(r.sig_b <= r.S_ALL + 0.05));

    // 2. Web Vertical Shear Stress verification line
    set('sv-tau',      fN(r.tau, 4));
    set('sv-tau-lim',  r.TAU_ALL_TR.toFixed(2));
    set('sv-tau-ok',   statusPill(r.tau <= r.TAU_ALL_TR + 0.05));

    // 3. Combined Von Mises Energy Distortion Stress verification line
    set('sv-vm',       fN(r.sig_vm, 3));
    set('sv-vm-lim',   r.S_ALL.toFixed(2));
    set('sv-vm-ok',    statusPill(r.sig_vm <= r.S_ALL + 0.05));

    // 4. FIXED: Changed 'r.tau_max' to 'r.tau_max_tr' to pull the correct calculated value
    set('sv-tr',       fN(r.tau_max_tr, 3));
    set('sv-tr-lim',   r.TAU_ALL_TR.toFixed(2));
    set('sv-tr-ok',    statusPill(r.tau_max_tr <= r.TAU_ALL_TR + 0.05));
  } else {
    stressSec.style.display = 'none';
  }
}
