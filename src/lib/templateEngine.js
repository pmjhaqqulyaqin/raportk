/**
 * Template Engine for RaportK
 * Replaces placeholder tokens in narrative text with actual student/school data.
 * 
 * Supported placeholders:
 *   [nama]      → student name
 *   [sekolah]   → school name
 *   [kelas]     → student group/class
 *   [fase]      → student phase
 *   [semester]  → semester
 *   [tahun]     → academic year
 *   [guru]      → teacher name
 *   [tanggal]   → report date
 *   [lokasi]    → school location
 */

/**
 * Replace all placeholders in text with actual values
 * @param {string} text - Text containing placeholders like [nama]
 * @param {Object} context - Data context
 * @param {Object} context.student - Student data { name, group, phase }
 * @param {Object} context.schoolInfo - School data { schoolName, teacher, semester, academicYear, date, location }
 * @returns {string} Text with placeholders replaced
 */
export function replacePlaceholders(text, context = {}) {
  if (!text) return '';
  
  const { student = {}, schoolInfo = {} } = context;
  
  const replacements = {
    '[nama]': student.name || '[nama]',
    '[sekolah]': schoolInfo.schoolName || '[sekolah]',
    '[kelas]': student.group || '[kelas]',
    '[fase]': student.phase || '[fase]',
    '[semester]': schoolInfo.semester || '[semester]',
    '[tahun]': schoolInfo.academicYear || '[tahun]',
    '[guru]': schoolInfo.teacher || '[guru]',
    '[tanggal]': schoolInfo.date || '[tanggal]',
    '[lokasi]': schoolInfo.location || '[lokasi]',
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

/**
 * Reverse-replace: convert actual student name back to [nama] placeholder
 * Useful when saving editor text as a reusable template
 * @param {string} text - Text with actual names
 * @param {string} studentName - Student name to replace back
 * @returns {string} Text with name replaced by [nama]
 */
export function reverseReplaceName(text, studentName) {
  if (!text || !studentName) return text;
  return text.replaceAll(studentName, '[nama]');
}

/**
 * Check if text contains any unreplaced placeholders
 * @param {string} text 
 * @returns {string[]} Array of found placeholder tokens
 */
export function findPlaceholders(text) {
  if (!text) return [];
  const regex = /\[(?:nama|sekolah|kelas|fase|semester|tahun|guru|tanggal|lokasi)\]/g;
  return [...new Set(text.match(regex) || [])];
}
