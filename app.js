// ═══════════════════════════════════════════════════════════════════
//  1. ENGINE IMPORTS
// ═══════════════════════════════════════════════════════════════════
import { calc } from './shared/core-math.js';
import {runEstimateCheck} from './components/00-estimates/controller.js';
import { initParameters, getFormValues } from './components/01-parameters/controller.js';
import { drawSFD, drawBMD } from './components/02-diagrams/controller.js';
import { updateResultsUI } from './components/03-results/controller.js';
import { renderTheoriesTable } from './components/04-theories/controller.js';
import { renderStressVerification } from './components/05-verification/controller.js';
import { renderParametricSweep } from './components/06-sweep/controller.js';
import { initEstimatesModule } from './components/00-estimates/controller.js';
import { drawSectionVis } from './components/07-visualisation/controller.js';

// ═══════════════════════════════════════════════════════════════════
//  2. ASYNCHRONOUS VIEW FRAGMENT LOADING LIFECYCLE
// ═══════════════════════════════════════════════════════════════════
async function loadViewFragment(targetId, filePath) {
  const response = await fetch(filePath);
  const rawHTML = await response.text();
  document.getElementById(targetId).innerHTML = rawHTML;
}

async function initMainAppLifecycle() {
  await loadViewFragment('estimates-container', './components/00-estimates/view.html');
  await loadViewFragment('parameters-container', './components/01-parameters/view.html');
  await loadViewFragment('diagrams-container', './components/02-diagrams/view.html');
  await loadViewFragment('results-dashboard-container', './components/03-results/view.html');
  await loadViewFragment('visualisation-container', './components/07-visualisation/view.html');
  await loadViewFragment('theories-container', './components/04-theories/view.html');
  await loadViewFragment('verification-container', './components/05-verification/view.html');
  await loadViewFragment('sweep-container', './components/06-sweep/view.html');

  // Wire input observers
  initParameters(runMasterCalculationPipeline);
  // ✅ FIXED: Initialize your new estimates module here so it attaches listeners and auto-calculates data
  initEstimatesModule();

  // Connect user interaction listeners for the main design parameters form panel
  initParameters(runMasterCalculationPipeline);
  
  // Trigger your master calculation cascade immediately on first page draw paint load
  runMasterCalculationPipeline();

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') runMasterCalculationPipeline();
  });

  // Fire master pipeline to draw initial dashboard layout states automatically
  runMasterCalculationPipeline();

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') runMasterCalculationPipeline();
  });
}

// ═══════════════════════════════════════════════════════════════════
//  3. MASTER DATA DISTRIBUTION PIPELINE
// ═══════════════════════════════════════════════════════════════════
function runMasterCalculationPipeline() {
  const errBanner = document.getElementById('error-banner');
  if (errBanner) errBanner.classList.add('hidden');

  const inputs = getFormValues();

  // Engineering defensive bounds validation checks
  const errs = [];
  if (isNaN(inputs.L) || inputs.L < 500) errs.push('Span L must be ≥ 500 mm.');
  if (isNaN(inputs.x) || inputs.x <= 0 || inputs.x >= inputs.L) errs.push('Position x must satisfy 0 < x < L.');
  if (isNaN(inputs.t1) || inputs.t1 < 4) errs.push('Thickness t₁ must be ≥ 4 mm.');
  if (isNaN(inputs.t2) || inputs.t2 < 4) errs.push('Thickness t₂ must be ≥ 4 mm.');
  if (isNaN(inputs.t3) || inputs.t3 < 4) errs.push('Thickness t₃ must be ≥ 4 mm.');
  if (isNaN(inputs.H) || inputs.H < 100) errs.push('Section height H must be ≥ 100 mm.');
  if ((inputs.t2 + inputs.t3) >= inputs.H) errs.push(`t₂ + t₃ (${inputs.t2 + inputs.t3} mm) exceeds height H (${inputs.H} mm).`);
  if (isNaN(inputs.P) || inputs.P < 0.1) errs.push('Load P must be ≥ 0.1 tonnes.');

  if (errs.length) {
    if (errBanner) {
      errBanner.innerHTML = errs.map(e => '⚠ ' + e).join('<br>');
      errBanner.classList.remove('hidden');
    }
    const resultsEl = document.getElementById('results');
    if (resultsEl) resultsEl.classList.add('hidden');
    return;
  }

  // Execute advanced structural engineering calculation matrix
  const r = calc(
    inputs.L, inputs.x, inputs.t1, inputs.t2, inputs.t3, 
    inputs.P, inputs.H, inputs.fos, inputs.fos_load
  );

  // Broadcast variables out to all your separate sub-controllers
  drawSFD(inputs.L, inputs.x, r.R_A, r.R_B);
  drawBMD(inputs.L, inputs.x, r.M_max);
  updateResultsUI(r, inputs);
  
  // Safely invoke your original cross-section and elevation drawing core
  drawSectionVis();

  renderTheoriesTable(r);
  renderStressVerification(r);
  renderParametricSweep(inputs.L, inputs.t1, inputs.P, inputs.H);

  // ── ✅ FIXED: AUTOMATICALLY REVEAL AND SCROLL STRAIGHT TO DIAGRAMS CONTAINER ──
  const diagramsEl = document.getElementById('diagrams-container');
  const resultsEl = document.getElementById('results');
  
  if (resultsEl) {
    resultsEl.classList.remove('hidden'); // Ensure results container is revealed
  }

  if (diagramsEl) {
    // Smoothly animate the viewport directly down to the Diagrams block card frame
    diagramsEl.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

window.addEventListener('DOMContentLoaded', initMainAppLifecycle);
