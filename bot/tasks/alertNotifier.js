import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logDebug } from '../helpers/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alertasPath = path.join(__dirname, '../data/AlertasProxPartidasAPI.json');
const usuariosPath = path.join(__dirname, '../data/UsuariosComNotificacao.json');

const JOGOS_VALIDOS = {
  counterstrike: 'Counter-Strike',
  valorant: 'VALORANT',
  leagueoflegends: 'League of Legends',
  rocketleague: 'Rocket League',
  pubg: 'PUBG',
  rainbowsix: 'Rainbow Six Siege',
  kingsleague: 'Kings League'
};

// Escapa caracteres especiais do MarkdownV2
const escapeMarkdown = (text = '') => {
  return String(text).replace(/([_\*\[\]()~`>#+=|{}.!\\\-])/g, '\\$1');
};

// Formata link de forma segura
const formatarLink = (url) => {
  if (!url) return '';
  const urlEscapada = escapeMarkdown(url).replace(/\)/g, '%29').replace(/\(/g, '%28');
  return `${urlEscapada}`;
};

const parseDateTime = (alerta) => {
  const meses = {
    janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
  };

  try {
    const [hora = 0, minuto = 0] = String(alerta.hora || '00:00').split(':').map(Number);
    const dia = parseInt(String(alerta.dia).replace(/\D/g, ''), 10) || 1;
    const mesKey = String(alerta.mes || '').toLowerCase().replace(/[^a-z]/g, '');
    const mes = meses[mesKey] ?? 0;
    const ano = parseInt(String(alerta.ano || new Date().getFullYear()).replace(/\D/g, ''), 10);
    return new Date(ano, mes, dia, hora, minuto);
  } catch (error) {
    console.error('❌ Erro ao parsear data:', alerta, error);
    return new Date();
  }
};

const verificarAlertas = (bot) => {
  try {
    let alertas = [];
    try {
      const raw = fs.readFileSync(alertasPath, 'utf-8');
      alertas = JSON.parse(raw || '[]');
    } catch (err) {
      console.error('❌ Erro ao ler AlertasProxPartidasAPI.json:', err.message);
      logDebug(`Erro no JSON de alertas: ${err.message}`);
      return;
    }

    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));
    const agora = new Date();
    let atualizou = false;

    alertas.forEach(alerta => {
      try {
        if (alerta.alertaDisparado) return;

        const dataAlvo = parseDateTime(alerta);
        if (agora >= dataAlvo) {
          const jogoKey = alerta.jogo?.toLowerCase().trim();

          if (!Object.keys(JOGOS_VALIDOS).includes(jogoKey)) {
            console.warn(`⚠️ Alerta ignorado: jogo desconhecido → ${jogoKey}`);
            return;
          }

          const nomeJogoBonito = JOGOS_VALIDOS[jogoKey];
          const destinatarios = usuarios[jogoKey] || [];

          const time1 = alerta.time1?.trim().toUpperCase() === 'FUR' ? 'FURIA' : alerta.time1;
          const time2 = alerta.time2?.trim().toUpperCase() === 'FUR' ? 'FURIA' : alerta.time2;

          console.log(`📡 [${jogoKey}] ${time1} vs ${time2} — ${destinatarios.length} usuários`);

          if (destinatarios.length === 0) {
            console.warn(`⚠️ Nenhum destinatário para o alerta de ${alerta.jogo}`);
            return;
          }

          const mensagem = [
            `🎮 *${escapeMarkdown(nomeJogoBonito)}* — ${escapeMarkdown(time1)} vs ${escapeMarkdown(time2)}`,
            `📺 *${escapeMarkdown(time1)}* vs *${escapeMarkdown(time2)}*`,
            `🗓 Hoje às ${escapeMarkdown(alerta.hora)}`,
            `🏆 ${escapeMarkdown(alerta.evento)}`,
            '',
            '🔗 Transmissão:',
            ...(alerta.stream_original ? [`• Original: ${formatarLink(alerta.stream_original)}`] : []),
            ...(alerta.stream_pt ? [`• ${escapeMarkdown('PT-BR')}: ${formatarLink(alerta.stream_pt)}`] : [])
          ].filter(Boolean).join('\n');

          destinatarios.forEach(async userId => {
            try {
              await bot.telegram.sendMessage(userId, mensagem, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: false
              });
              logDebug(`✅ Alerta enviado para ${userId}: ${jogoKey}`);
            } catch (err) {
              console.error(`❌ Erro ao enviar para ${userId}:`, err.message);
            }
          });

          alerta.alertaDisparado = true;
          atualizou = true;
        }
      } catch (error) {
        console.error('❌ Erro no processamento de alerta individual:', alerta, error);
        logDebug(`Erro no alerta de ${alerta.jogo}: ${error.message}`);
      }
    });

    if (atualizou) {
      fs.writeFileSync(alertasPath, JSON.stringify(alertas, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('❌ Erro geral na verificação de alertas:', error);
    logDebug(`Erro geral no sistema de alertas: ${error.message}`);
  }
};

export default function startAlertNotifier(bot) {
  const agora = new Date();
  const delay = 60000 - (agora.getSeconds() * 1000 + agora.getMilliseconds());

  const intervalMin = parseInt(process.env.ALERT_CHECK_INTERVAL_MINUTES || '1', 10);
  const intervalMs = intervalMin * 60 * 1000;

  setTimeout(() => {
    verificarAlertas(bot);
    setInterval(() => verificarAlertas(bot), intervalMs);
  }, delay);
}

