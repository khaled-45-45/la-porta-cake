/**
 * formatCurrency — formats a number as Jordanian Dinar (JOD)
 * @param {number} amount
 * @returns {string}  e.g. "14.00 JOD"
 */
export function formatCurrency(amount) {
  return `${Number(amount).toFixed(2)} JOD`;
}
