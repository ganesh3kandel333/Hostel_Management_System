export const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toLocaleString()} - ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${new Date().toLocaleString()} - ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toLocaleString()} - ${message}`);
  },
  debug: (message) => {
    console.log(`[DEBUG] ${new Date().toLocaleString()} - ${message}`);
  }
};
