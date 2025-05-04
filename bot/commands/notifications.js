import { Markup } from 'telegraf';
import fs from 'fs/promises';
import path from 'path';
import { escapeMarkdownV2 } from '../helpers/escape.js';
import { logDebug } from '../helpers/logger.js';
import { safeEdit } from '../helpers/safeedit.js';
import { sourcePreference } from '../index.js';

const NOTIFICATIONS_FILE = path.resolve('bot/data/UsuariosComNotificacao.json');

const GAMES = {
  CS:    { key: 'counterstrike',    name: '💥 CS:GO / CS2' },
  LOL:   { key: 'leagueoflegends',  name: '🐉 League of Legends' },
  R6:    { key: 'rainbowsix',       name: '🔫 Rainbow Six' },
  RL:    { key: 'rocketleague',     name: '🚗 Rocket League' },
  PUBG:  { key: 'pubg',             name: '🪖 PUBG' },
  VAL:   { key: 'valorant',         name: '🎯 Valorant' },
  KINGS: { key: 'kingsleague',      name: '⚽ KingsLeague' }
};

async function readNotifications() {
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    const initial = Object.fromEntries(
      Object.values(GAMES).map(g => [g.key, []])
    );
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function updateNotifications(gameKey, userId, add = true) {
  const data = await readNotifications();
  const users = new Set(data[gameKey]);

  add ? users.add(userId) : users.delete(userId);
  data[gameKey] = Array.from(users);

  await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
  return data;
}

export default function registerNotifications(bot) {
  bot.action('NOTIFICATIONS_MENU', async ctx => {
    await ctx.answerCbQuery();

    const SOURCE_MODE = process.env.SOURCE?.trim() || '2';
    const DEFAULT_SOURCE = SOURCE_MODE === '1' ? 'API' : 'SCRAPING';
    const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;

    const buttons = [
      ...Object.entries(GAMES)
        .filter(([key]) => source !== 'API' || key !== 'KINGS')
        .map(([key, cfg]) => [
          Markup.button.callback(cfg.name, `NOTIFY_${key}`)
        ]),
      [Markup.button.callback('📢 Todos os Jogos', 'NOTIFY_ALL')],
      [Markup.button.callback('◀️ Voltar', 'BACK')]
    ];

    await safeEdit(ctx, '\\-                🔔 *Receber Notificações*\\:                \\-\n\nEscolha o jogo:', {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: buttons }
    });
  });

  bot.action('NOTIFY_ALL', async ctx => {
    await ctx.answerCbQuery();

    const message = `🔔 Deseja ativar ou remover notificações para *todos os jogos*?`;

    const buttons = [
      [
        Markup.button.callback('✅ Ativar Todos', 'CONFIRM_ALL_ON'),
        Markup.button.callback('⛔ Remover Todos', 'CONFIRM_ALL_OFF')
      ],
      [Markup.button.callback('◀️ Voltar', 'NOTIFICATIONS_MENU')]
    ];

    await safeEdit(ctx, escapeMarkdownV2(message), {
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: buttons }
    });
  });

  bot.action(/^CONFIRM_ALL_(ON|OFF)$/, async ctx => {
    const mode = ctx.match[1];
    const userId = ctx.chat.id;
    const add = mode === 'ON';
    const data = await readNotifications();

    for (const game of Object.values(GAMES)) {
      const users = new Set(data[game.key]);
      add ? users.add(userId) : users.delete(userId);
      data[game.key] = Array.from(users);
    }

    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));

    const msg = add
      ? '✅ Agora você receberá notificações para *todos os jogos*!'
      : '⛔ Notificações para *todos os jogos* foram removidas.';

    await safeEdit(ctx, escapeMarkdownV2(msg), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔙 Voltar ao Menu', 'NOTIFICATIONS_MENU')]
        ]
      }
    });
  });

  Object.keys(GAMES).forEach(key => {
    bot.action(`NOTIFY_${key}`, async ctx => {
      const userId = ctx.chat.id;
      const game = GAMES[key];

      await ctx.answerCbQuery();
      const notifications = await readNotifications();
      const isSubscribed = notifications[game.key].includes(userId);

      const message = isSubscribed
        ? `❌ Você já recebe notificações para ${game.name}\nDeseja parar de receber?`
        : `🔔 Você quer receber notificações para:\n*${game.name}*?`;

      const buttons = [
        [
          Markup.button.callback(
            isSubscribed ? '⛔ Parar Notificações' : '✅ Sim',
            `CONFIRM_${key}_${isSubscribed ? 'OFF' : 'ON'}`
          )
        ],
        [Markup.button.callback('◀️ Voltar', 'NOTIFICATIONS_MENU')]
      ];

      await safeEdit(ctx, escapeMarkdownV2(message), {
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons }
      });
    });

    bot.action(/^CONFIRM_(.+)_(ON|OFF)$/, async ctx => {
      const [, keyMatch, mode] = ctx.match;
      const game = GAMES[keyMatch];
      const userId = ctx.chat.id;
    
      if (!game) {
        return ctx.answerCbQuery('⚠️ Jogo inválido.');
      }
    
      try {
        await updateNotifications(game.key, userId, mode === 'ON');
    
        const message = mode === 'ON'
          ? `✅ Inscrito em ${game.name}!\n\nVocê receberá alertas de novas partidas!`
          : `❌ Notificações para ${game.name} desligadas.`;
    
        await safeEdit(ctx, escapeMarkdownV2(message), {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔙 Voltar ao Menu', 'NOTIFICATIONS_MENU')]
            ]
          }
        });
      } catch {
        await ctx.answerCbQuery('⚠️ Falha ao atualizar configurações!');
      }
    });
    
    
  });
}
