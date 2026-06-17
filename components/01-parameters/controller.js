/**
 * Attaches the master calculation execution trigger to your button element
 */
export function initParameters(onCalculateTriggerCallback) {
  const calcBtn = document.getElementById('btn-calc');
  if (calcBtn) {
    // We clear any old listeners and explicitly bind the calculation pipeline to the click event
    calcBtn.removeEventListener('click', onCalculateTriggerCallback);
    calcBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevents any accidental page reloads
      onCalculateTriggerCallback();
    });
  }
}

/**
 * Extracts and maps all 9 original variables directly from your input elements live
 */
export function getFormValues() {
  return {
    L: parseFloat(document.getElementById('inp-L')?.value || 7800),
    x: parseFloat(document.getElementById('inp-x')?.value || 3900),
    P: parseFloat(document.getElementById('inp-P')?.value || 150),
    H: parseFloat(document.getElementById('inp-H')?.value || 850),
    fos: parseFloat(document.getElementById('inp-fos')?.value || 1.2),
    fos_load: parseFloat(document.getElementById('inp-fos-load')?.value || 1.0),
    t1: parseFloat(document.getElementById('inp-t1')?.value || 12),
    t2: parseFloat(document.getElementById('inp-t2')?.value || 25),
    t3: parseFloat(document.getElementById('inp-t3')?.value || 25)
  };
}
