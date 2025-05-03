import OpenAI from 'openai';
import { buildPrompt } from '../context/index.js';
import { logDebug } from '../helpers/logger.js';
import { mainMenu } from '../helpers/menus.js';
import { sourcePreference } from '../state/source.js';
import { safeEdit } from '../helpers/safeedit.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const gptSessions = new Map();
const gptUsage = new Map();
const GPT_DAILY_LIMIT = parseInt(process.env.GPT_DAILY_LIMIT || '20', 10);

export default function registerGptChat(bot) {

  /* Ativa modo conversa ------------------------------------ */
  bot.action('GPTCHAT', async ctx => {
    gptSessions.set(ctx.chat.id.toString(), []);

    await safeEdit(ctx, 
      '🤖 *Modo conversa ativado!* Digite /sair para voltar.\n\nFala Furioso(a), bora bater um papo?', 
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] } // Remove o menu
      }
    );
  });

  /* Sai do modo -------------------------------------------- */
  bot.command('sair', ctx => {
    if (gptSessions.delete(ctx.chat.id.toString())) {
      const src = sourcePreference.get(ctx.chat.id) || 'API';
      ctx.reply('🔙 Saiu do modo conversa.', {
        parse_mode: 'Markdown',
        ...mainMenu(ctx)
      });
    }
  });

  /* Handler de mensagens ----------------------------------- */
  bot.on('text', async ctx => {
    const id = ctx.chat.id.toString();
    if (!gptSessions.has(id)) return;

    const today = new Date().toISOString().split('T')[0];
    const usage = gptUsage.get(id) || { date: today, count: 0 };
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }

    if (usage.count >= GPT_DAILY_LIMIT) {
      return ctx.reply(`⚠️ Limite diário de ${GPT_DAILY_LIMIT} mensagens atingido.`);
    }

    usage.count++;
    gptUsage.set(id, usage);
    logDebug(`GPT usado por ${id}: ${usage.count}/${GPT_DAILY_LIMIT}`);

    try {
      const fullPrompt = await buildPrompt(ctx.message.text);

      const r = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 400,
        messages: [{ role: 'system', content: fullPrompt }]
      });

      ctx.reply(r.choices[0].message.content);
    } catch (err) {
      console.error('[GPT]', err);
      ctx.reply('⚠️ Erro ao falar com o GPT.');
    }
  });
}

export { gptSessions, gptUsage };
