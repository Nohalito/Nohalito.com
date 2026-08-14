/**
 * Age in whole year
 *
 * @param birthYear Four-digit year, e.g. 2004.
 * @returns Age in years.
 */
export function calculateAge(birthYear) {
  return new Date().getFullYear() - birthYear
}
