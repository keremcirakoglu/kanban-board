/**
 * Safely parse a JSON string. Returns fallback if parsing fails or the result is null.
 * @param {string} str - The JSON string to parse.
 * @param {*} fallback - Fallback value if parsing fails.
 * @returns {*} The parsed JSON or the fallback value.
 */
export const safeJSONParse = (str, fallback) => {
  try {
    const parsed = JSON.parse(str);
    return parsed === null ? fallback : parsed;
  } catch (error) {
    console.error("Error:", error);
    return fallback;
  }
};

/**
 * Log an error to the console.
 * @param {*} error - The error to log.
 */
export const logError = (error) => {
  console.error("Error:", error);
};