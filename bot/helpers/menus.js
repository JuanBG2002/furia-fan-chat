import { Markup } from 'telegraf';
import { sourcePreference } from '../state/source.js';

const SOURCE_MODE = process.env.SOURCE?.trim() || '2';
const DEFAULT_SOURCE = SOURCE_MODE === '1' ? 'API' : 'SCRAPING';

/* ——— MENU PRINCIPAL —————————————————————————— */
export const mainMenu = (ctx) => {
  const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;
  
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📅 Próxima Partida', 'NEXT_MENU'),
    ],
    [
      Markup.button.callback('👾 Acompanhar AO VIVO', 'LIVE_MENU'),
    ],
    ...(source === 'SCRAPING'
      ? [[Markup.button.callback('🏆 Próximos Campeonatos', 'TOURNAMENT_MENU')]]
      : []
    ),
    [
      Markup.button.callback('🔔 Notificações', 'NOTIFICATIONS_MENU'),
    ],
    [
      Markup.button.callback('🌐 Redes Sociais', 'SOCIALS'),
    ],
    [
      Markup.button.callback('🤖 Modo Conversa', 'GPTCHAT'),
    ],
    [
      Markup.button.url('🛍 Loja Oficial', process.env.FURIA_STORE_URL),
      Markup.button.url('💬 Grupo Torcida', process.env.FURIA_FANS_CHAT),
    ],
    [
      Markup.button.callback('🎥 Criadores de Conteúdo', 'CREATORS'),
      ...(SOURCE_MODE === '3'
        ? [Markup.button.callback('⚙️ Mudar Fonte', 'CHANGE_SOURCE')]
        : [])
    ]
  ]);
};

/* ——— SUB-MENUS ————————————————————————————— */
export const submenuNext = (ctx) => {
  const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;

  if (source === 'API') {
    return Markup.inlineKeyboard([
      [{ text: '💥 CS:GO / CS2', callback_data: 'NEXT_API_COUNTERSTRIKE' }],
      [{ text: '🐉 League of Legends', callback_data: 'NEXT_API_LEAGUEOFLEGENDS' }],
      [{ text: '🔫 Rainbow Six', callback_data: 'NEXT_API_RAINBOWSIX' }],
      [{ text: '🚗 Rocket League', callback_data: 'NEXT_API_ROCKETLEAGUE' }],
      [{ text: '🪖 PUBG', callback_data: 'NEXT_API_PUBG' }],
      [{ text: '🎯 Valorant', callback_data: 'NEXT_API_VALORANT' }],
      [{ text: '◀️ Voltar', callback_data: 'BACK' }]
    ]);
  }

  return Markup.inlineKeyboard([
    [{ text: '💥 CS:GO / CS2', callback_data: 'NEXT_SCRAP_CS' }],
    [{ text: '🐉 League of Legends', callback_data: 'NEXT_SCRAP_LOL' }],
    [{ text: '🔫 Rainbow Six', callback_data: 'NEXT_SCRAP_R6' }],
    [{ text: '🚗 Rocket League', callback_data: 'NEXT_SCRAP_RL' }],
    [{ text: '🪖 PUBG', callback_data: 'NEXT_SCRAP_PUBG' }],
    [{ text: '🎯 Valorant', callback_data: 'NEXT_SCRAP_VAL' }],
    [{ text: '⚽ KingsLeague', callback_data: 'NEXT_SCRAP_KINGS' }],
    [{ text: '🗓 Calendário de Partidas', callback_data: 'CALENDAR_MATCHES' }],
    [{ text: '◀️ Voltar', callback_data: 'BACK' }]
  ]);
};

export const submenuLive = (ctx) => {
  const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;

  return Markup.inlineKeyboard([
    [{ text: '💥 CS:GO / CS2', callback_data: 'LIVE_API_CS' }],
    [{ text: '🐉 League of Legends', callback_data: 'LIVE_API_LOL' }],
    [{ text: '🔫 Rainbow Six', callback_data: 'LIVE_API_R6SIEGE' }],
    [{ text: '🚗 Rocket League', callback_data: 'LIVE_API_RL' }],
    [{ text: '🪖 PUBG', callback_data: 'LIVE_API_PUBG' }],
    [{ text: '🎯 Valorant', callback_data: 'LIVE_API_VALORANT' }],
    [{ text: '◀️ Voltar', callback_data: 'BACK' }]
  ]);
};

export const submenuTournaments = (ctx) => {
  const source = sourcePreference.get(ctx.chat.id) || DEFAULT_SOURCE;
  
  return Markup.inlineKeyboard([
    [{ text: '💥 CS:GO / CS2', callback_data: 'TOUR_SCRAP_CS' }],
    [{ text: '🐉 League of Legends', callback_data: 'TOUR_SCRAP_LOL' }],
    [{ text: '🔫 Rainbow Six', callback_data: 'TOUR_SCRAP_R6' }],
    [{ text: '🚗 Rocket League', callback_data: 'TOUR_SCRAP_RL' }],
    [{ text: '🪖 PUBG', callback_data: 'TOUR_SCRAP_PUBG' }],
    [{ text: '🎯 Valorant', callback_data: 'TOUR_SCRAP_VAL' }],
    ...(source === 'SCRAPING'
      ? [[{ text: '🗓 Calendário Completo', callback_data: 'CALENDAR_TOURNAMENTS' }]]
      : []),
    [{ text: '◀️ Voltar', callback_data: 'BACK' }]
  ]);
};

/* ——— CONTROLES DE PARTIDA AO VIVO ————————————— */
export const liveControls = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('❌ Parar Monitoramento', 'STOP_LIVE')],
  ]);