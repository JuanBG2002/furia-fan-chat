import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const api = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: { Authorization: `Bearer ${process.env.PANDASCORE_TOKEN}` }
});

// Configuração dos times por jogo
const TEAM_CONFIG = {
  counterstrike: { id: parseInt(process.env.FURIA_TEAM_ID), route: 'csgo' },
  valorant: { id: parseInt(process.env.FURIA_TEAM_ID_VALORANT), route: 'valorant' },
  leagueoflegends: { id: parseInt(process.env.FURIA_TEAM_ID_LOL), route: 'lol' },
  rocketleague: { id: parseInt(process.env.FURIA_TEAM_ID_RL), route: 'rl' },
  pubg: { id: parseInt(process.env.FURIA_TEAM_ID_PUBG), route: 'pubg' },
  rainbowsix: { id: parseInt(process.env.FURIA_TEAM_ID_R6SIEGE), route: 'r6siege' }
};

const MONTHS_PT = {
  Jan: 'Janeiro', Feb: 'Fevereiro', Mar: 'Março', Apr: 'Abril',
  May: 'Maio', Jun: 'Junho', Jul: 'Julho', Aug: 'Agosto',
  Sep: 'Setembro', Oct: 'Outubro', Nov: 'Novembro', Dec: 'Dezembro'
};

function formatDate(isoDate) {
  const date = new Date(isoDate);
  date.setHours(date.getHours() - 3); // Ajuste para GMT-3
  
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: MONTHS_PT[date.toLocaleString('en-US', { month: 'short' })],
    year: date.getFullYear(),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
}

export default async function updateApiCache() {
  const output = { updatedAt: new Date().toISOString() };

  for (const [gameKey, { id: teamId, route }] of Object.entries(TEAM_CONFIG)) {
    try {
      console.log(`🔄 Buscando partidas de ${gameKey}...`);
      
      const [upcoming, running] = await Promise.all([
        api.get(`/${route}/matches/upcoming`, { params: { per_page: 50 } }),
        api.get(`/${route}/matches/running`, { params: { per_page: 50 } })
      ]);

      const matches = [...upcoming.data, ...running.data]
        .filter(m => m.opponents?.some(o => o.opponent?.id === teamId))
        .map(match => {
          const { day, month, year, time } = formatDate(match.begin_at);
          const streams = match.streams_list || [];
          
          return {
            teamLeft: match.opponents[0]?.opponent?.name || 'Desconhecido',
            teamRight: match.opponents[1]?.opponent?.name || 'Desconhecido',
            time,
            day,
            month,
            year,
            event: match.league?.name || 'Desconhecido',
            leagueId: match.league?.id,
            stream_original: streams.find(s => s.main)?.raw_url || '',
            stream_pt: streams.find(s => s.language === 'pt')?.raw_url || ''
          };
        });

      output[gameKey] = {
        matches,
        tournaments: [...new Set(matches.map(m => m.event))]
          .map(event => ({
            name: event,
            ...matches.find(m => m.event === event)
          }))
      };

    } catch (error) {
      console.error(`❌ Erro em ${gameKey}:`, error.message);
      output[gameKey] = { matches: [], tournaments: [] };
    }
  }

  const outPath = path.resolve('bot/data', 'api_cache.json');
  await fs.writeFile(outPath, JSON.stringify(output, null, 2));
  console.log(`✅ Cache atualizado em ${outPath}`);
  
  return output;
}