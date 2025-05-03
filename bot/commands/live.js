import { getLiveMatch, getMatchEventsFromGame } from '../services/pandascore.js';
import { liveControls, mainMenu } from '../helpers/menus.js';
import { sourcePreference } from '../state/source.js';
import { logDebug } from '../helpers/logger.js';
import { safeEdit } from '../helpers/safeedit.js';
import dotenv from 'dotenv';
dotenv.config();

/* IDs de time por jogo */
const TEAM_IDS = {
  cs: process.env.FURIA_TEAM_ID_CS || '126689',
  lol: process.env.FURIA_TEAM_ID_LOL,
  valorant: process.env.FURIA_TEAM_ID_VALORANT,
  rl: process.env.FURIA_TEAM_ID_RL,
  pubg: process.env.FURIA_TEAM_ID_PUBG,
  r6siege: process.env.FURIA_TEAM_ID_R6SIEGE
};

const SOURCE_MODE = process.env.SOURCE?.trim() || '2';
const DEFAULT_SOURCE = SOURCE_MODE === '1' ? 'API' : 'SCRAPING';

export const watchers = new Map();
let monitorLoop = null;

function formatEvent(ev) {
  if (ev.type === 'kill') return `☠️ ${ev.player} matou ${ev.target}`;
  if (ev.type === 'bomb_planted') return '💣 Bomba plantada!';
  if (ev.type === 'win_round') return `🏆 Round para ${ev.winner}`;
  return `🎯 ${ev.type}`;
}

async function liveLoop(bot) {
  try {
    const match = await getLiveMatch(); // Pode ser ajustado por jogo depois
    if (!match?.game_id) return;

    const events = await getMatchEventsFromGame(match.game_id);
    if (!events?.length) return;

    for (const [chatId, data] of watchers.entries()) {
      try {
        const novosEventos = events
          .slice()
          .reverse()
          .filter(ev => ev.id !== data.lastEventId);

        if (!novosEventos.length) continue;

        const newData = {
          lastEventId: novosEventos[0].id,
          history: [
            ...novosEventos.map(formatEvent),
            ...data.history
          ].slice(0, 5)
        };

        const content = [
          `(TR) *${match.teams[0]}* x (CT) *${match.teams[1]}*`,
          `Placar: ${match.score[0]} a ${match.score[1]}`,
          '\n*Últimos eventos:*',
          ...newData.history
        ].join('\n');

        watchers.set(chatId, { ...data, ...newData });

        await safeEdit({
          chat: { id: chatId },
          callbackQuery: { message: { message_id: data.messageId } }
        }, content, {
          parse_mode: 'Markdown',
          ...liveControls()
        });

      } catch (error) {
        logDebug(`Erro no chat ${chatId}: ${error.message}`);
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logDebug('[LIVE] Acesso PRO requerido - parando monitor');
      handleProAccessDenied(bot);
    }
  }
}

function handleProAccessDenied(bot) {
  watchers.forEach(async (data, chatId) => {
    try {
      await bot.telegram.editMessageText(
        chatId,
        data.messageId,
        undefined,
        '🔒 Esta funcionalidade exige o plano *PandaScore PRO*.\nMonitor encerrado.',
        {
          parse_mode: 'Markdown',
          ...mainMenu({ chat: { id: chatId } })
        }
      );
    } catch (error) {
      await bot.telegram.sendMessage(
        chatId,
        '🔒 Funcionalidade PRO necessária',
        mainMenu({ chat: { id: chatId } })
      );
    }
  });

  watchers.clear();
  clearInterval(monitorLoop);
  monitorLoop = null;
}

export default function registerLive(bot) {
  const games = Object.entries(TEAM_IDS);

  for (const [alias, teamId] of games) {
    bot.action(`LIVE_API_${alias.toUpperCase()}`, async ctx => {
      await handleLiveRequest(ctx, teamId, alias);
    });
  }

  bot.action('DEBUG_PRO', async ctx => {
    await ctx.answerCbQuery();

    if (watchers.has(ctx.chat.id)) {
      return safeEdit(ctx, '🔄 Monitor já ativo!', liveControls());
    }

    const match = await getLiveMatch(TEAM_IDS.cs); // ou outro time padrão para verificação
    if (!match || !match.teams?.length) {
      return safeEdit(ctx, '⚠️ Nenhuma partida ao vivo detectada para iniciar o monitoramento.\n\n_Tente novamente em alguns minutos._', {
        parse_mode: 'Markdown',
        ...mainMenu(ctx)
      });
    }

    const msg = await safeEdit(ctx, '📡 Iniciando monitoramento...', {
      parse_mode: 'Markdown',
      ...liveControls()
    });

    if (msg) {
      watchers.set(ctx.chat.id, {
        messageId: msg.message_id,
        lastEventId: null,
        history: []
      });

      if (!monitorLoop) {
        monitorLoop = setInterval(() => liveLoop(bot), 5000);
        logDebug('[LIVE] Monitor iniciado');
      }
    }
  });

  bot.action('STOP_LIVE', async ctx => {
    await ctx.answerCbQuery();
    const hadWatchers = watchers.delete(ctx.chat.id);

    if (hadWatchers) {
      await safeEdit(ctx, '🔇 Monitoramento parado', {
        ...mainMenu(ctx)
      });
    }

    if (!watchers.size && monitorLoop) {
      clearInterval(monitorLoop);
      monitorLoop = null;
      logDebug('[LIVE] Monitor parado');
    }
  });
}

async function handleLiveRequest(ctx, teamId, alias) {
  try {
    const match = await getLiveMatch(teamId); // 🧠 Precisa aceitar teamId na função
    const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;

    if (!match?.teams?.length) {
      return safeEdit(ctx,
        `⚠️ Nenhuma partida ao vivo de ${alias.toUpperCase()} no momento` +
        (source === 'API' ? '\n\n_Fonte: PandaScore_' : ''),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '[Debug] LiveEvents PRO', callback_data: 'DEBUG_PRO' }],
              [{ text: '◀️ Voltar', callback_data: 'BACK' }]
            ]
          }
        }
      );
    }

    const streams = [
      match.streams?.find(s => s.main),
      match.streams?.find(s => s.language === 'pt' && !s.main)
    ].filter(Boolean);

    const content = [
      `🏷️ *${match.teams[0]}* vs *${match.teams[1]}*`,
      `🏆 ${match.event}`,
      `📊 Placar: ${match.score[0]} a ${match.score[1]}`,
      ...streams.map(s => `📺 ${s.language.toUpperCase()}: ${s.raw_url}`)
    ].join('\n');

    await safeEdit(ctx, content, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: '[Debug] LiveEvents PRO', callback_data: 'DEBUG_PRO' }],
          [{ text: '◀️ Voltar', callback_data: 'BACK' }]
        ]
      }
    });
  } catch (error) {
    logDebug(`Erro na consulta ao vivo [${alias}]: ${error.message}`);
    await safeEdit(ctx, '⚠️ Falha na obtenção de dados', liveControls());
  }
}
