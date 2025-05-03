import fs from 'fs/promises';
import { escapeMarkdownV2 } from '../helpers/escape.js';
import { mainMenu } from '../helpers/menus.js';
import { sourcePreference } from '../state/source.js';
import { safeEdit } from '../helpers/safeedit.js';
import {
  GAMES,
  abreviacoes,
  normalizeTeamName,
  formatTime,
  FULL_MONTHS_PT
} from '../helpers/formatacao.js';

const fonte = 'Fonte: Liquipedia.net';
const esc = escapeMarkdownV2;

async function readCache() {
  try {
    const raw = await fs.readFile('./bot/data/liquipedia_cache.json', 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function registerScrapGames(bot) {
  for (const [alias, cfg] of Object.entries(GAMES)) {

    bot.action(`NEXT_SCRAP_${alias}`, async ctx => {
      await ctx.answerCbQuery();
      const cache = await readCache();
      const m = cache[cfg.key]?.matches?.[0];
      const t = cache[cfg.key]?.tournaments?.[0];

      if (!m) {
        const tournamentDate = t?.ongoing
          ? 'AGORA'
          : t?.day && t?.month && t?.year
            ? `${t.day} de ${t.month} de ${t.year}`
            : null;

        const txt =
          `${esc(`⚠️ Nenhuma próxima partida de ${cfg.label}.\n`)}\n` +
          (tournamentDate
            ? `🏆 Próximo campeonato *${esc(t.name)}* \\(${esc(tournamentDate)}\\)`
            : esc('E nenhum campeonato futuro disponível.')) +
          `\n\n${esc(fonte)}`;

        return safeEdit(ctx, txt, {
          parse_mode: 'MarkdownV2',
          reply_markup: { inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_NEXT' }]] }
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

      safeEdit(ctx, msg, {
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_NEXT' }]] }
      });
    });

    bot.action(`LIVE_SCRAP_${alias}`, async ctx => {
      await ctx.answerCbQuery();
      safeEdit(ctx,
        `${cfg.icon} Monitoramento ao vivo via scraping ainda não implementado para ${cfg.label}.`,
        { reply_markup: { inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_TOUR' }]] } }
      );
    });

    bot.action(`TOUR_SCRAP_${alias}`, async ctx => {
      await ctx.answerCbQuery();
      const cache = await readCache();
      const list = cache[cfg.key]?.tournaments || [];

      const formatted = list.map(t => {
        const code = abreviacoes[cfg.key] || cfg.key.slice(0, 2).toUpperCase();
        const data = t.ongoing
          ? 'AGORA'
          : (t.day && t.month && t.year)
            ? `${String(t.day).padStart(2, '0')} de ${t.month} de ${t.year}`
            : null;

        return data
          ? `• ${esc(data)} — [${code}] *${esc(t.name)}*`
          : `• [${code}] *${esc(t.name)}*`;
      });

      const msg =
        `${esc(cfg.icon)} *Próximos Campeonatos* de ${esc(cfg.label)}\n\n` +
        (formatted.length ? formatted.join('\n') : esc('Nenhum campeonato futuro encontrado.')) +
        `\n\n${esc(fonte)}`;

      await safeEdit(ctx, msg, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_TOUR' }]]
        }
      });
    });
  }

  bot.action('CALENDAR_MATCHES', async ctx => {
    await ctx.answerCbQuery();
    const cache = await readCache();

    const partidas = Object.entries(cache).flatMap(([key, game]) =>
      (game.matches || []).map(m => ({
        game: abreviacoes[key] || key.toUpperCase(),
        team1: normalizeTeamName(m.teamLeft),
        team2: normalizeTeamName(m.teamRight),
        event: m.event,
        day: m.day,
        month: m.month,
        year: m.year,
        time: m.time
      }))
    );

    partidas.sort((a, b) => {
      const da = new Date(`${a.year}-${a.month}-${a.day}`);
      const db = new Date(`${b.year}-${b.month}-${b.day}`);
      return da - db;
    });

    const agrupadas = {};
    for (const p of partidas) {
      const dia = `${p.day} de ${p.month} de ${p.year}`;
      if (!agrupadas[dia]) agrupadas[dia] = [];
      agrupadas[dia].push(
        ` ${p.time || '--:--'} - ${p.game} - ${p.team1} vs ${p.team2} - ${p.event}`
      );
    }

    const body = Object.entries(agrupadas)
      .map(([dia, linhas]) => `*${dia}*\n${linhas.join('\n')}`)
      .join('\n\n');

    const final = body || 'Nenhuma partida agendada encontrada';

    await safeEdit(ctx, `📆 *Calendário de Partidas*\n\n${final}\n\n${fonte}`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_NEXT' }]] }
    });
  });

  bot.action('CALENDAR_TOURNAMENTS', async ctx => {
    await ctx.answerCbQuery();
    const cache = await readCache();
    const eventos = [];

    for (const [key, game] of Object.entries(cache)) {
      const code = abreviacoes[key] || key.slice(0, 2).toUpperCase();
      for (const t of game.tournaments || []) {
        const data = t.ongoing
          ? 'AGORA'
          : (t.day && t.month && t.year)
            ? `${String(t.day).padStart(2, '0')} de ${t.month} de ${t.year}`
            : null;

        if (data) {
          eventos.push({
            ongoing: !!t.ongoing,
            date: t.ongoing ? null : new Date(`${t.year}-${t.month}-${t.day}`),
            text: `• ${esc(data)} — [${code}] *${esc(t.name)}*`
          });
        }
      }
    }

    eventos.sort((a, b) => {
      if (a.ongoing && !b.ongoing) return -1;
      if (!a.ongoing && b.ongoing) return 1;
      if (!a.date || !b.date) return 0;
      return a.date - b.date;
    });

    const body = eventos.map(e => e.text).join('\n') || 'Nenhum campeonato futuro encontrado.';

    await safeEdit(ctx, `🗓 *Calendário de Campeonatos*\n\n${body}\n\n${esc(fonte)}`, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[{ text: '◀️ Voltar', callback_data: 'BACK_TOUR' }]]
      }
    });
  });
}
