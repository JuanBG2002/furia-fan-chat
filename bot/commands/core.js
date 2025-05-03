import {
  mainMenu,
  submenuNext,
  submenuLive,
  submenuTournaments
} from '../helpers/menus.js';
import { sourcePreference } from '../state/source.js';
import { logDebug } from '../helpers/logger.js';
import { safeEdit } from '../helpers/safeedit.js';
import { gptSessions } from './gptChat.js';

const SOURCE_MODE = process.env.SOURCE?.trim() || '2';
const DEFAULT_SOURCE = SOURCE_MODE === '1' ? 'API' : 'SCRAPING';

// Middleware de inicialização global
export function initSourcePreference() {
  return (ctx, next) => {
    const id = ctx.chat?.id;
    if (id && !sourcePreference.has(id)) {
      sourcePreference.set(id, DEFAULT_SOURCE);
      logDebug(`Inicializado source para ${id}: ${DEFAULT_SOURCE}`);
    }
    return next();
  };
}

export default function registerCore(bot) {
  // Aplicar middleware global
  bot.use(initSourcePreference());

  /* ——— /start ————————————— */
  bot.start(async ctx => {
    const id = ctx.chat.id;

    if (SOURCE_MODE === '3' && !sourcePreference.has(id)) {
      return ctx.reply('- 👋 Como você prefere ver os dados da FURIA? -', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Usar API (PandaScore)', callback_data: 'SOURCE_API' }],
            [{ text: '📖 Usar Scraping (Liquipedia)', callback_data: 'SOURCE_SCRAPING' }]
          ]
        }
      });
    }

    return ctx.reply('- 👋 *Bem-vindo(a) ao FURIA Fan Chat!* -', {
      parse_mode: 'Markdown',
      ...mainMenu(ctx)
    });
  });

  /* ——— BACK ——————— */
  bot.action('BACK', ctx => {
    logDebug('BACK de', ctx.chat.id);
    safeEdit(ctx, '- 👋 *Bem-vindo(a) ao FURIA Fan Chat!* -', {
      parse_mode: 'Markdown',
      ...mainMenu(ctx)
    });
  });

  /* ——— Mudar Fonte ——————————————————————— */
  bot.action('SOURCE_API', ctx => {
    sourcePreference.set(ctx.chat.id, 'API');
    ctx.answerCbQuery('🔗 Fonte: API');
    safeEdit(ctx, '- 👋 *Bem-vindo(a)!* -', {
      parse_mode: 'Markdown',
      ...mainMenu(ctx)
    });
  });

  bot.action('SOURCE_SCRAPING', ctx => {
    sourcePreference.set(ctx.chat.id, 'SCRAPING');
    ctx.answerCbQuery('📖 Fonte: Scraping');
    safeEdit(ctx, '- 👋 *Bem-vindo(a)!* -', {
      parse_mode: 'Markdown',
      ...mainMenu(ctx)
    });
  });

  bot.action('CHANGE_SOURCE', ctx => {
    if (SOURCE_MODE === '3') {
      sourcePreference.delete(ctx.chat.id);
      safeEdit(ctx, '- 👋 Como você prefere ver os dados? -', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Usar API', callback_data: 'SOURCE_API' }],
            [{ text: '📖 Usar Scraping', callback_data: 'SOURCE_SCRAPING' }]
          ]
        }
      });
    } else {
      ctx.answerCbQuery('⚙️ Alteração de fonte desativada no modo atual.');
    }
  });

  /* ——— Submenus ————————————— */
  bot.action('NEXT_MENU', ctx => {
    ctx.answerCbQuery();
    safeEdit(ctx, '-                  📅 *Escolha o jogo:*             -', {
      parse_mode: 'Markdown',
      ...submenuNext(ctx)
    });
  });

  bot.action('LIVE_MENU', ctx => {
    ctx.answerCbQuery();
    safeEdit(ctx, '-     👾 *Monitoramento ao Vivo:*      -', {
      parse_mode: 'Markdown',
      ...submenuLive(ctx)
    });
  });

  bot.action('TOURNAMENT_MENU', ctx => {
    ctx.answerCbQuery();
    safeEdit(ctx, '-          🏆 *Próximos Campeonatos:*           -', {
      parse_mode: 'Markdown',
      ...submenuTournaments(ctx)
    });
  });

  bot.action('BACK_NEXT', ctx => {
    safeEdit(ctx, '-                 📅 *Escolha o jogo:*           -', {
      parse_mode: 'Markdown',
      ...submenuNext(ctx)
    });
  });

  bot.action('BACK_TOUR', ctx => {
    safeEdit(ctx, '- 🏆 *Próximos Campeonatos:* -', {
      parse_mode: 'Markdown',
      ...submenuTournaments(ctx)
    });
  });

  bot.use(async (ctx, next) => {
    // Não responde se for comando, botão ou estiver no modo GPT (corrigido com toString)
    if (
      ctx.message?.text?.startsWith('/') ||
      ctx.callbackQuery ||
      gptSessions.has(ctx.chat.id.toString())
    ) {
      return next();
    }
  
    if (ctx.message?.text) {
      await ctx.reply('- 👋 *Bem-vindo(a) ao FURIA Fan Chat!* -', {
        parse_mode: 'Markdown',
        ...mainMenu(ctx)
      });
    }
  
    return next();
  });
}