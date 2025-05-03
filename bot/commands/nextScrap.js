import fs from 'fs/promises';
import { Markup } from 'telegraf';
const fonte = 'Fonte: Liquipedia.net';


export default function registerNextScrap (bot) {
  bot.action('NEXT_SCRAP', async ctx => {
    try {
      const raw   = await fs.readFile('./bot/data/liquipedia_cache.json','utf8');
      const cache = JSON.parse(raw);
      const m     = cache.matches?.[0];
      const t     = cache.tournaments?.[0];

      if (!m) {
        const msg =
        `${esc(cfg.icon)} *Próximos Campeonatos – ${esc(cfg.label)}*\n\n` +
        (formatted.length ? formatted.join('\n') : esc('Nenhum campeonato futuro encontrado.')) +
        `\n\nFonte: Liquipedia\\.net`;

        return ctx.editMessageText(noMatchTxt,{
          parse_mode:'Markdown',
          reply_markup:{ inline_keyboard:[
            t ? [{ text:'Ver Próximos Campeonatos', callback_data:'LIST_TOURNAMENTS' }] : [],
            [{ text:'◀️ Voltar', callback_data: 'BACK_NEXT' }]
          ].filter(row=>row.length) }
        });
      }

      const matchTxt =
        `*${m.teamLeft}* ${m.score} *${m.teamRight}*\n` +
        `📆 ${m.date}\n🏆 ${m.event}\n🎯 Formato: ${m.format}\n\n${fonte}`;

      ctx.editMessageText(matchTxt,{
        parse_mode:'Markdown',
        reply_markup:{ inline_keyboard:[
          [{ text:'Ver Próximos Campeonatos', callback_data:'LIST_TOURNAMENTS' }],
          [{ text:'◀️ Voltar', callback_data: 'BACK_NEXT' }]
        ]}
      });

    } catch (err) {
      console.error('Scrap NEXT erro', err);
      ctx.editMessageText('⚠️ Erro ao ler dados do Liquipedia.',{
        reply_markup:{ inline_keyboard:[[{ text:'◀️ Voltar', callback_data: 'BACK_NEXT' }]] }
      });
    }
  });

  /* lista campeonatos */
  bot.action('LIST_TOURNAMENTS', async ctx => {
    const raw   = await fs.readFile('./bot/data/liquipedia_cache.json','utf8');
    const cache = JSON.parse(raw);
    const list  = cache.tournaments?.map(t=>`• ${t.date} — *${t.name}*`).join('\n') || 'Nenhum encontrado.';
    ctx.editMessageText(`🏆 *Próximos campeonatos*\n\n${list}\n\n${fonte}`,{
      parse_mode:'Markdown',
      reply_markup:{ inline_keyboard:[[ { text:'◀️ Voltar', callback_data: 'BACK_NEXT' } ]] }
    });
  });
}
