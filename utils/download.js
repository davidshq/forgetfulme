/**
 * @fileoverview Browser download helpers
 * @module utils/download
 */

/**
 * Trigger a JSON file download in the browser.
 * @param {unknown} data - Serializable data to export
 * @param {string} filename - Download filename (including `.json`)
 */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
