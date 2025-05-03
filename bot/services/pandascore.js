import axios from 'axios';
import 'dotenv/config';

/*  Carrega TOKEN e ID do time via .env  */
const TOKEN = process.env.PANDASCORE_TOKEN;
const FURIA_ID = Number(process.env.FURIA_TEAM_ID);

if (!TOKEN || !FURIA_ID) {
  console.error('❌ Erro: PANDASCORE_TOKEN ou FURIA_TEAM_ID não definidos no .env');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente carregadas com sucesso');

const API = axios.create({
  baseURL: 'https://api.pandascore.co/csgo',
  headers: { Authorization: `Bearer ${TOKEN}` }
});

/* Utilitário para montagem de parâmetros */
function makeParams(extra = {}) {
  return {
    per_page: 50,
    ...extra,
  };
}

/* ─────────────────────────────────────────────
   📅 Próxima ou atual partida
────────────────────────────────────────────── */
export async function getNextMatch() {
  try {
    let match = await fetchMatchByStatus('running', 'cs-2');
    if (!match) match = await fetchMatchByStatus('upcoming', 'cs-2');
    if (!match) match = await fetchMatchByStatus('running', 'cs-go');
    if (!match) match = await fetchMatchByStatus('upcoming', 'cs-go');
    if (!match) return null;

    const [team1, team2] = match.opponents.map(o => o.opponent.name);

    return {
      team1,
      team2,
      event: match.league.name,
      date: new Date(match.begin_at).toLocaleString('pt-BR'),
      status: match.status,
      link  : match.live_url || match.league.url || '',
      streams: match.streams_list || []
    };
  } catch (err) {
    console.error('❌ Erro em getNextMatch():', err.message);
    return null;
  }
}

async function fetchMatchByStatus(status, videogameTitle) {
  const { data } = await API.get(`/matches/${status}`, {
    params: makeParams({
      sort: 'begin_at',
      'filter[videogame_title]': videogameTitle
    })
  });

  return data.find(m =>
    m.opponents?.some(o => o.opponent?.id === FURIA_ID)
  );
}

/* ─────────────────────────────────────────────
   🟢 Partida ao vivo (versão gratuita)
────────────────────────────────────────────── */
export async function getLiveMatch() {
  try {
    let match = await fetchMatchByStatus('running', 'cs-2');
    if (!match) match = await fetchMatchByStatus('running', 'cs-go');
    if (!match) return null;

    const [team1, team2] = match.opponents.map(o => o.opponent.name);

    return {
      opponents: match.opponents,
      teams: [team1, team2],
      score: [
        match.results?.[0]?.score ?? 0,
        match.results?.[1]?.score ?? 0
      ],
      event: match.league.name,
      status: match.status,
      link: match.live_url || match.league.url,
      streams: match.streams_list || [],
      serie_id: match.serie_id,   
      game_id: match.games?.[0]?.id || null
    };
  } catch (err) {
    console.error('❌ Erro em getLiveMatch():', err.message);
    return null;
  }
}

/* ─────────────────────────────────────────────
   🎯 Eventos da série (necessário plano PRO)
────────────────────────────────────────────── */
export async function getMatchEventsFromGame(gameId) {
  const url = `/games/${gameId}/events`;
  console.log(`🔍 Buscando eventos para game ID ${gameId}`);
  console.log(`🌐 URL: ${API.defaults.baseURL}${url}`);

  try {
    const { data } = await API.get(url);
    console.log(`✅ Eventos encontrados: ${data.length}`);
    return data;
  } catch (err) {
    const status = err.response?.status;
    console.error(`❌ Erro ao buscar eventos do game ${gameId}`);

    // ──⛔️ Plano grátis → deixa o caller encerrar ─────────────
    if (status === 403) {                         // Access Denied
      console.error('🔒 Plano atual não permite acesso a eventos em tempo real.');
      throw err;                                  // ← apenas repropaga
    }
    // ─────────────────────────────────────────────────────────

    if (status === 404)
      console.error('📄 Game não encontrado ou sem eventos.');
    console.error('📄 Detalhes:', err.response?.data || err.message);
    return [];                                    // mantém fallback
  }
}

