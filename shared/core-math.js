// ── Material & Structural Constants ────────────────────────
export const SY      = 250;       // MPa yield strength IS 2062 E250
export const E_MOD   = 210000;    // N/mm² modulus of elasticity
export const G_NperT = 9810;      // N per tonne force multiplier

// Standard baseline fallback for external UI components
export const TAU_ALL_TR = 100;    

/**
 * Closed-form inversion of hollow-rectangle second moment of area.
 * b(t) = [12·I_req − 2t₁·(H−t₂−t₃)³] / [H³ − (H−2t₂−t₃)³]
 */
export function solveBDirect(I_req, t1, t2, t3, H) {
  const hi = H - t2 - t3;
  const denom = H ** 3 - hi ** 3;
  if (denom === 0) return Infinity;
  const numerator = 12 * I_req - 2 * t1 * hi ** 3;
  return numerator / denom;
}

/**
 * Moment of inertia calculation (Three-thickness box section profile)
 */
export function momentOfInertia(B, t1, t2, t3, H) {
  const bi = B - 2 * t1;
  const hi = H - t2 - t3;
  if (bi <= 0 || hi <= 0) return 0;
  return (B * H ** 3 - bi * hi ** 3) / 12;
}

/**
 * Section modulus calculation about Neutral Axis at H/2
 */
export function sectionModulus(B, t1, t2, t3, H) {
  const bi = B - 2 * t1;
  const hi = H - t2 - t3;
  if (bi <= 0 || hi <= 0) return 0;
  const I_xx = (B * H ** 3 - bi * hi ** 3) / 12;
  return I_xx / (H / 2);
}

/**
 * Allowable bending stress per governing thick plate rule
 */
export function allowableBendingStress(t1, t2, t3, FOS) {
  const t_gov = Math.max(t1, t2, t3);
  if (t_gov <= 20)      return 250 / FOS;
  if (t_gov <= 40)      return 240 / FOS;
  return 230 / FOS;
}

/**
 * Deflection equation at load point x (Simply supported point load P at x)
 * δ_x = P·a²·b² / (3·E·I·L)
 */
export function deflectionAtLoad(P_N, L, x, E, I) {
  const a = x;
  const b = L - x;
  if (I <= 0) return 0;
  return (P_N * (a ** 2) * (b ** 2)) / (3 * E * I * L);
}

/**
 * Master calculation framework mapping 9 variable parameters
 */
export function calc(L, x, t1, t2, t3, P_tonnes, H, FOS, FOS_load) {
  const TAU_ALL_TR_DYN = SY / (2 * FOS); 
  const P_N = P_tonnes * G_NperT * FOS_load;
  
  // Asymmetric Reaction and Moment Formulas restored from original code
  const R_A = (P_N * (L - x)) / L;
  const R_B = (P_N * x) / L;
  const V_max = Math.max(R_A, R_B);
  const M_max = (P_N * x * (L - x)) / L;
  
  const hi = H - t2 - t3;
  const A_w = 2 * t1 * H;
  const tau = V_max / A_w;
  const S_ALL = allowableBendingStress(t1, t2, t3, FOS);

  // ── Theory 1: Pure Bending ──
  const I_req_bend = (M_max * (H / 2)) / S_ALL;
  const B_bend = solveBDirect(I_req_bend, t1, t2, t3, H);

  // ── Theory 2: Von Mises ──
  const disc_vm = S_ALL ** 2 - 3 * tau ** 2;
  let s_allow_vm = 0, I_req_vm = Infinity, B_vm = Infinity;
  if (disc_vm > 0) {
    s_allow_vm = Math.sqrt(disc_vm);
    I_req_vm   = (M_max * (H / 2)) / s_allow_vm;
    B_vm       = solveBDirect(I_req_vm, t1, t2, t3, H);
  }

  // ── Theory 3: Tresca ──
  const disc_tr = TAU_ALL_TR_DYN ** 2 - tau ** 2;
  let s_allow_tr = 0, I_req_tr = Infinity, B_tr = Infinity;
  if (disc_tr > 0) {
    s_allow_tr = 2 * Math.sqrt(disc_tr);
    I_req_tr   = (M_max * (H / 2)) / s_allow_tr;
    B_tr       = solveBDirect(I_req_tr, t1, t2, t3, H);
  }

  // Governing B selection
  const B_gov = Math.max(B_bend, B_vm, B_tr);
  const B_des_raw = B_gov > 0 ? Math.ceil(B_gov / 5) * 5 : B_gov;

    let B_des = NaN, I_xx = NaN, Z_des = NaN, sig_b = NaN, sig_vm = NaN, tau_max_tr = NaN, defl = NaN;
  if (B_gov > 0 && isFinite(B_gov)) {
    B_des      = Math.round(B_des_raw);
    Z_des      = sectionModulus(B_des, t1, t2, t3, H);
    I_xx       = (B_des * (H ** 3) - (B_des - 2 * t1) * (hi ** 3)) / 12;
    sig_b      = Z_des > 0 ? M_max / Z_des : Infinity;
    sig_vm     = Math.sqrt((sig_b ** 2) + 3 * (tau ** 2));
    tau_max_tr = Math.sqrt(((sig_b / 2) ** 2) + (tau ** 2));
    
    // Deflection solved using the pure bending design threshold B_bend rounded up
    const B_ref = Math.ceil(B_bend / 5) * 5;
    const I_ref = momentOfInertia(B_ref, t1, t2, t3, H);
    defl = deflectionAtLoad(P_N, L, x, E_MOD, I_ref);
  } else {
    B_des = B_gov;
  }


  return {
    P_N, R_A, R_B, V_max, M_max, hi, A_w, tau, S_ALL, TAU_ALL_TR: TAU_ALL_TR_DYN,
    I_req_bend, B_bend, s_allow_vm, I_req_vm, B_vm, s_allow_tr, I_req_tr, B_tr,
    B_gov, B_des, I_xx, Z_des, sig_b, sig_vm, tau_max_tr, defl
  };
}
