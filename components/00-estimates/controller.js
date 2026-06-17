export function initEstimatesModule() {
  const checkBtn = document.getElementById("btn-est-calc");
  if (checkBtn) {
    checkBtn.addEventListener("click", runEstimateCheck);
  }

  // Auto-execute calculation sequence to populate fields instantly on startup
  runEstimateCheck();
}

export function runEstimateCheck() {
  const estErr = document.getElementById("est-error");
  estErr.classList.add("hidden");

  const B = parseFloat(document.getElementById("est-B").value);
  const H = parseFloat(document.getElementById("est-H").value);
  const t1 = parseFloat(document.getElementById("est-t1").value);
  const t2 = parseFloat(document.getElementById("est-t2").value);
  const t3 = parseFloat(document.getElementById("est-t3").value);
  const P_t = parseFloat(document.getElementById("est-P").value);
  const L = parseFloat(document.getElementById("est-L").value);
  const x_pos = parseFloat(document.getElementById("est-x").value);
  const FOS = parseFloat(document.getElementById("est-fos").value);
  const FOS_load = parseFloat(document.getElementById("est-fos-load").value);
  const SY_input = parseFloat(document.getElementById("est-sy").value);

  // Validation
  const errs = [];
  if (isNaN(B) || B <= 0) errs.push("Breadth B must be > 0 mm.");
  if (isNaN(H) || H <= 0) errs.push("Height H must be > 0 mm.");
  if (isNaN(t1) || t1 <= 0) errs.push("Web thickness t₁ must be > 0 mm.");
  if (isNaN(t2) || t2 <= 0) errs.push("Top flange t₂ must be > 0 mm.");
  if (isNaN(t3) || t3 <= 0) errs.push("Bottom flange t₃ must be > 0 mm.");
  if (!isNaN(t2) && !isNaN(t3) && !isNaN(H) && t2 + t3 >= H)
    errs.push(
      `t₂ + t₃ = ${t2 + t3} mm ≥ H = ${H} mm. Inner height would be ≤ 0.`,
    );
  if (!isNaN(t1) && !isNaN(B) && 2 * t1 >= B)
    errs.push(`2·t₁ = ${2 * t1} mm ≥ B = ${B} mm. Inner width would be ≤ 0.`);
  if (isNaN(P_t) || P_t <= 0) errs.push("Load P must be > 0 tonnes.");
  if (isNaN(L) || L <= 0) errs.push("Span L must be > 0 mm.");
  if (isNaN(x_pos) || x_pos <= 0 || x_pos >= L)
    errs.push("Load position x must satisfy 0 < x < L.");
  if (isNaN(FOS) || FOS < 1.0) errs.push("FOS must be ≥ 1.0.");
  if (isNaN(FOS_load) || FOS_load < 1.0) errs.push("FOS_load must be ≥ 1.0.");
  if (isNaN(SY_input) || SY_input <= 0)
    errs.push("σy (yield strength) must be > 0 MPa.");

  if (errs.length) {
    estErr.innerHTML = "⚠ " + errs.join("<br>⚠ ");
    estErr.classList.remove("hidden");
    document.getElementById("est-results-strip").style.display = "none";
    document.getElementById("est-verdict").style.display = "none";
    return;
  }

  const G_NperT = 9810; // N per tonne
  const E_MOD = 210000; // N/mm²

  // Use user-supplied yield strength directly for this section
  const SY = SY_input;

  const P_N = P_t * G_NperT * FOS_load;

  const h_inner = H - t2 - t3;
  const b_inner = B - 2 * t1;
  const I_xx = (1 / 12) * (B * Math.pow(H, 3) - b_inner * Math.pow(h_inner, 3));

  const Z = I_xx / (H / 2);

  // Asymmetric point-load moment: M = P·x·(L−x)/L
  const M_max = (P_N * x_pos * (L - x_pos)) / L;

  const sig_b = M_max / Z;
  const sig_allow = SY / FOS;

  // Deflection at load point x (simply supported, point load at x)
  // δ_x = P·a²·b² / (3·E·I·L)   where a = x, b = L−x
  const a_d = x_pos;
  const b_d = L - x_pos;
  const defl = (P_N * a_d * a_d * b_d * b_d) / (3 * E_MOD * I_xx * L);

  document.getElementById("est-results-strip").style.display = "flex";

  document.getElementById("est-kv-I").textContent = (I_xx / 1e9).toFixed(4);
  document.getElementById("est-kv-Z").textContent = (Z / 1e6).toFixed(4);
  document.getElementById("est-kv-Mmax").textContent = (M_max / 1e6).toFixed(3);
  document.getElementById("est-kv-sig").textContent = sig_b.toFixed(3);
  document.getElementById("est-kv-sall").textContent = sig_allow.toFixed(2);
  document.getElementById("est-kv-defl").textContent = defl.toFixed(3);

  const verdict = document.getElementById("est-verdict");
  const vIcon = document.getElementById("est-verdict-icon");
  const vTitle = document.getElementById("est-verdict-title");
  const vSub = document.getElementById("est-verdict-sub");

  const pass = sig_b <= sig_allow;

  verdict.style.display = "flex";
  verdict.className = "est-verdict " + (pass ? "pass" : "fail");
  vIcon.textContent = pass ? "Passed" : "Failed";
  vTitle.textContent = pass
    ? "STRESS CHECK PASSED — Section is adequate"
    : "STRESS CHECK FAILED — Section is overstressed";
  vSub.textContent = `σ_b = ${sig_b.toFixed(3)} MPa  ${pass ? "≤" : ">"}  σ_allow = ${sig_allow.toFixed(2)} MPa   (x = ${x_pos} mm)`;
}
