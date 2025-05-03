// bot/helpers/safeedit.js
import { logDebug } from './logger.js';

// Variável para cache dos watchers
let _watchers = null;

async function getWatchers() {
  if (!_watchers) {
    const liveModule = await import('../commands/live.js');
    _watchers = liveModule.watchers;
  }
  return _watchers;
}

export async function safeEdit(ctx, text, extra = {}) {
  try {
    // Tenta editar normalmente
    const result = await ctx.editMessageText(text, {
      disable_web_page_preview: true,
      ...extra
    });
    return result;
  } catch (editError) {
    logDebug(`safeEdit: Falha na edição (${editError.message})`);

    try {
      // Envia nova mensagem
      const newMessage = await ctx.reply(text, {
        ...extra,
        reply_markup: extra.reply_markup || undefined,
        disable_web_page_preview: true
      });

      // Atualiza watchers se aplicável
      if (ctx.callbackQuery?.data?.startsWith('LIVE')) {
        const watchers = await getWatchers();
        const chatId = ctx.chat?.id;
        
        if (chatId && watchers.has(chatId)) {
          watchers.set(chatId, {
            ...watchers.get(chatId),
            messageId: newMessage.message_id
          });
        }
      }

      return newMessage;
    } catch (sendError) {
      logDebug(`safeEdit: Fallback falhou (${sendError.message})`);
      return null;
    }
  }
}