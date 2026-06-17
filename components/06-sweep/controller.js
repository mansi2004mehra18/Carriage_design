import { calc } from '../../shared/core-math.js';
import { fB, feasCell } from '../../shared/ui-helpers.js';

/**
 * Generates the dynamic thickness iterations matrix grid (t₁ = 8 to 63 mm)
 */
export function renderParametricSweep(L, t1, P_tonnes, H) {
  const tbody = document.getElementById('sweep-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Extract other input states dynamically to avoid breaking the inner math loops
  const x        = parseFloat(document.getElementById('inp-x')?.value || 3900);
  const t2       = parseFloat(document.getElementById('inp-t2')?.value || 25);
  const t3       = parseFloat(document.getElementById('inp-t3')?.value || 25);
  const fos      = parseFloat(document.getElementById('inp-fos')?.value || 1.2);
  const fos_load = parseFloat(document.getElementById('inp-fos-load')?.value || 1.0);

  for (let tv = 8; tv <= 63; tv++) {
    if ((t2 + t3) >= H) break; // Skip physically impossible section dimensions
    
    // Evaluate loop row using the complete 9-parameter configuration formula
    const rv = calc(L, x, tv, t2, t3, P_tonnes, H, fos, fos_load);
    const isCurrentT1Row = tv === t1;

    const bDesStr = (rv.B_des > 0 && !isNaN(rv.B_des)) 
      ? Math.round(rv.B_des) 
      : '<span class="neg">NEG</span>';
      
    const deflStr = isNaN(rv.defl)   ? '—' : rv.defl.toFixed(4);
    const sigbStr = isNaN(rv.sig_b)  ? '—' : rv.sig_b.toFixed(2);
    const tauStr  = isNaN(rv.tau)    ? '—' : rv.tau.toFixed(4);

    const row = document.createElement('tr');
    if (isCurrentT1Row) {
      row.className = 'highlight-row';
    }
    
    row.innerHTML = `
      <td>${tv}</td>
      <td>${fB(rv.B_bend)}</td>
      <td>${fB(rv.B_vm)}</td>
      <td>${fB(rv.B_tr)}</td>
      <td>${bDesStr}</td>
      <td>${sigbStr}</td>
      <td>${tauStr}</td>
      <td>${deflStr}</td>
      <td>${feasCell(rv.B_des)}</td>
    `;
    tbody.appendChild(row);
  }
}
