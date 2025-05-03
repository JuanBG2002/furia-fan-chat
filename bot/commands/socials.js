// bot/commands/socials.js
import { Markup } from 'telegraf';
import socialLinks from '../data/socialLinks.js';
import { logDebug } from '../helpers/logger.js';

/* ───── Listas de jogadores / criadores ───────────────────── */
const players = {
  SOC_CS   : ['FalleN','KSCERATO','yuurih','molodoy','yekindar','sidde (Coach)'],
  SOC_KINGS: ['Neymar Jr (Presidente)','Cris Guedes (Presidente)','Carlos Eduardo (Treinador)',
              'Guilherme Monagatti','Caio Catroca','Murillo Donato','Ryan Lima','Matheus Ayosa',
              'João Pelegrini','Gabriel Pastuch','Victor Hugo','Matheus Dedo','Jeffinho',
              'Lipão','Leleti','Andrey Batata'],
  SOC_RL   : ['yANXNZ','Lostt','DRUFINHO','STL (Coach)'],
  SOC_PUBG : ['guizeraa','Haven','possa','zkrakeN'],
  SOC_LOL  : ['Guigo','Tatu','Tutsz','Ayu','JoJo']
};

const creators = [
  'Xarola','Belky','Otsuka','Sofia Espanha','Paulanobre',
  'Mount','Brino','Gafallen','Jxmo','MWZera'
];

/* ───── Helper para slug seguro (≤64 bytes ASCII) ─────────── */
function safeId (name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acentos
    .replace(/[^\w]/g, '_')                           // só letras/dígitos/_
    .slice(0, 60);
}

/* ───── Registro de comandos/ações ───────────────────────── */
export default function registerSocials (bot) {
  logDebug('Registrando comandos de redes sociais');

  /* ---- Menu “SOCIALS” ------------------------------------ */
  bot.action('SOCIALS', ctx =>
    ctx.editMessageText('🌐 *Redes Sociais da FURIA*', {
      parse_mode:'Markdown',
      reply_markup:{ inline_keyboard:[
        [{ text:'🏴 Organização', callback_data:'SOC_ORG' }],
        [{ text:'🎮 Jogos',       callback_data:'SOC_GAMES' }],
        [{ text:'◀️ Voltar',      callback_data:'BACK'      }]
      ]}
    })
  );

  /* ---- Submenu de jogos ---------------------------------- */
  bot.action('SOC_GAMES', ctx =>
    ctx.editMessageText('🎮 *Escolha o jogo:*', {
      parse_mode:'Markdown',
      reply_markup:{ inline_keyboard:[
        [{ text:'💥 Counter Strike',        callback_data:'SOC_CS'   }],
        [{ text:'⚽ Kings League', callback_data:'SOC_KINGS'}],
        [{ text:'🚗 Rocket League',callback_data:'SOC_RL'   }],
        [{ text:'🔫 PUBG',         callback_data:'SOC_PUBG' }],
        [{ text:'🐉 LoL',          callback_data:'SOC_LOL'  }],
        [{ text:'◀️ Voltar',       callback_data:'SOCIALS'  }]
      ]}
    })
  );

  /* ---- Organização --------------------------------------- */
  bot.action('SOC_ORG', ctx =>
    ctx.editMessageText('🏴 *FURIA nas redes sociais*\n'+socialLinks['FURIA'],{
      parse_mode:'Markdown',
      reply_markup:{ inline_keyboard:[[
        { text:'◀️ Voltar', callback_data:'SOCIALS' }
      ]] }
    })
  );

  /* ---- Atletas por jogo ---------------------------------- */
  Object.keys(players).forEach(code => {
    bot.action(code, ctx => {
      const rows = players[code].map(name => {
        const id = safeId(name);
        return [Markup.button.callback(name, `SOC_LINK_${id}`)];
      });
      rows.push([Markup.button.callback('◀️ Voltar','SOC_GAMES')]);

      ctx.editMessageText('🎯 *Atletas e Técnicos:*', {
        parse_mode:'Markdown',
        reply_markup:{ inline_keyboard: rows }
      });
    });
  });

  /* ---- Criadores de conteúdo ----------------------------- */
  bot.action('CREATORS', ctx => {
    const list = creators.map(n => `• ${n} → ${socialLinks[n]}`).join('\n');
    ctx.editMessageText('🎥 Criadores de Conteúdo FURIA\n\n'+list, {
      reply_markup:{ inline_keyboard:[[
        { text:'◀️ Voltar', callback_data:'BACK' }
      ]] }
    });
  });

  /* ---- Links individuais -------------------------------- */
  Object.entries(socialLinks).forEach(([name, url]) => {
    const id = safeId(name);
    bot.action(`SOC_LINK_${id}`, ctx => {
      ctx.editMessageText(`🔗 Redes sociais de ${name}:\n${url}`,{
        // sem parse_mode — evita problemas com "_" nas URLs
        reply_markup:{ inline_keyboard:[[
          { text:'◀️ Voltar', callback_data:'SOC_GAMES' }
        ]] }
      });
    });
  });
}
