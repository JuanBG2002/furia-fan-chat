import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import loadCommands from './loaders/commands.js';
import { logDebug } from './helpers/logger.js';
import { updateLiquipedia } from './services/liquipedia.js';
import updateApiCache from './scripts/apiCacheManager.js';
import generateAlerts from './scripts/alertGenerator.js';
import startAlertNotifier from './tasks/alertNotifier.js';

dotenv.config();

/* INSTÂNCIA PRINCIPAL ----------------------------------------- */
export const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { 
    webhookReply: false,
    agent: null,
    ...(process.env.NODE_ENV === 'production' && {
      options: {
        disable_web_page_preview: true
      }
    })
  }
});

/* GESTÃO DE ESTADO -------------------------------------------- */
export const sourcePreference = new Map();

/* FUNÇÕES DE ATUALIZAÇÃO SEPARADAS ---------------------------- */
async function updateLiquipediaData() {
  try {
    console.log('🔄 Atualizando Liquipedia...');
    await updateLiquipedia();
    await generateAlerts(); // Gera alertas com base em ambos os dados
    console.log('✅ Liquipedia atualizada');
  } catch (err) {
    console.error('❌ Erro na atualização do Liquipedia:', err.message);
  }
}

async function updateApiData() {
  try {
    console.log('🔄 Atualizando API PandaScore...');
    await updateApiCache();
    await generateAlerts(); // Gera alertas com base em ambos os dados
    console.log('✅ API atualizada');
  } catch (err) {
    console.error('❌ Erro na atualização da API:', err.message);
  }
}

/* EXECUÇÃO INICIAL E INTERVALOS ------------------------------- */
const liquipediaInterval = parseInt(process.env.LIQUIPEDIA_INTERVAL_MINUTES || '15', 10);
const apiInterval = parseInt(process.env.API_INTERVAL_MINUTES || '15', 10);

// Executa uma vez cada
updateLiquipediaData();
updateApiData();

// Agenda individualmente
setInterval(updateLiquipediaData, liquipediaInterval * 60 * 1000);
setInterval(updateApiData, apiInterval * 60 * 1000);

/* MIDDLEWARE GLOBAL ------------------------------------------- */
bot.use(async (ctx, next) => {
  try {
    ctx.telegram.options = ctx.telegram.options || {};
    ctx.telegram.options.disable_web_page_preview = true;
    
    await next();
  } catch (error) {
    logDebug(`Erro global: ${error.message}`);
    try {
      await ctx.reply('⚠️ Ocorreu um erro. Tente novamente!');
    } catch (err) {
      logDebug(`Falha ao reportar erro: ${err.message}`);
    }
  }
});

startAlertNotifier(bot);

/* CARREGAMENTO DE COMANDOS ------------------------------------ */
(async () => {
  try {
    await loadCommands(bot);
    logDebug('✅ Comandos carregados');
    
    bot.launch().then(() => {
      console.log('[BOT] Iniciado com sucesso ✅');
      console.log(`Modo fonte: ${process.env.SOURCE || '2'}`);
    });
    
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Falha crítica:', error);
    process.exit(1);
  }
})();
