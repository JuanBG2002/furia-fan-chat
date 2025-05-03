import { readdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { logDebug } from '../helpers/logger.js';

export default async function loadCommands (bot) {
  // pasta /commands relativa a este arquivo
  const base = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'commands');

  // todos os arquivos .js dentro de /commands
  const files = (await readdir(base)).filter(f => f.endsWith('.js'));

  for (const file of files) {
    // converte p/ URL file://
    const moduleURL = pathToFileURL(join(base, file)).href;

    const { default: register } = await import(moduleURL);
    if (typeof register === 'function') {
      register(bot);
      logDebug(`🔗 Comando carregado: ${file}`);
    }
  }
}
