import fs from 'fs/promises';
import { escapeMarkdownV2 } from '../helpers/escape.js';
import { safeEdit } from '../helpers/safeedit.js';
import {
  GAMES,
  abreviacoes,
  normalizeTeamName,
  formatTime
} from '../helpers/formatacao.js';

const fonte = 'Fonte: API (PandaScore)';
const esc = escapeMarkdownV2;

async function readCache() {
  try {
    const raw = await fs.readFile('./bot/data/api_cache.json', 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function registerNextApiGames(bot) {
  for (const [alias, cfg] of Object.entries(GAMES)) {
    const actionKey = `NEXT_API_${cfg.key.toUpperCase()}`;

    bot.action(actionKey, async ctx => {
      await ctx.answerCbQuery();
      const cache = await readCache();
      const m = cache[cfg.key]?.matches?.[0];

      if (!m) {
        const txt =
          `${esc(`Nenhuma próxima agendada de ${cfg.label}.\n`)}\n` +
          `${esc(fonte)}`;

        return safeEdit(ctx, txt, {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_NEXT' }]]
          }
        });
      }

      const score = m.score?.trim() || 'vs';
      const format = m.format?.trim();
      const date = `${m.day} de ${m.month} de ${m.year}`;
      const time = m.time || '--:--';
      const event = m.event || 'Evento não identificado';

      let msg =
        `Próxima partida de ${esc(cfg.label)}\n\n` +
        `${esc(normalizeTeamName(m.teamLeft))} vs ${esc(normalizeTeamName(m.teamRight))}\n` +
        `📆 ${esc(date)}\n` +
        `🕒 ${esc(time)}\n` +
        `🏆 ${esc(event)}\n`;

      if (format) msg += `🎯 Formato: ${esc(format)}\n`;

      msg += `\n${esc(fonte)}`;

      const buttons = [];

      if (m.stream_pt || m.stream_original) {
        buttons.push([
          {
            text: '🔗 Ver Transmissão',
            url: m.stream_pt || m.stream_original
          }
        ]);
      }

      buttons.push([{ text: '◀️ Voltar', callback_data: 'BACK_NEXT' }]);

      safeEdit(ctx, msg, {
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons },
        disable_web_page_preview: true
      });
    });
  }
}
