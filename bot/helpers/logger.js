/** Loga só quando DEBUG=true no .env */
export function logDebug (...msg) {
    if ((process.env.DEBUG || '').toLowerCase() === 'true') {
      console.log('[DEBUG]', ...msg);
    }
  }
  