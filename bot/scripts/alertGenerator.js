import fs from 'fs/promises';
import path from 'path';

const GAME_NAMES = {
  counterstrike: 'Counter-Strike',
  valorant: 'VALORANT',
  leagueoflegends: 'League of Legends',
  rocketleague: 'Rocket League',
  pubg: 'PUBG',
  rainbowsix: 'Rainbow Six Siege',
  kingsleague: 'Kings League'
};

const MONTHS_NUM = {
  Janeiro: '01', Fevereiro: '02', Março: '03', Abril: '04',
  Maio: '05', Junho: '06', Julho: '07', Agosto: '08',
  Setembro: '09', Outubro: '10', Novembro: '11', Dezembro: '12'
};

function parseDate(day, month, year, time = '00:00') {
  const pad = n => n.toString().padStart(2, '0');
  const monthNum = MONTHS_NUM[month] || '12';
  const [hours = '00', minutes = '00'] = time.replace(/[^0-9:]/g, '').split(':');

  return new Date(
    `${year}-${monthNum}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`
  );
}

function createSortKey(match) {
  try {
    const date = parseDate(
      match.dia || '01',
      match.mes || 'Dezembro',
      match.ano || new Date().getFullYear(),
      match.hora || '00:00'
    );
    return date.getTime();
  } catch (error) {
    console.error('Erro ao parsear data:', match);
    return Number.MAX_SAFE_INTEGER;
  }
}

async function loadLiquipediaKingsMatches() {
  try {
    const raw = await fs.readFile(path.resolve('bot/data', 'liquipedia_cache.json'), 'utf8');
    const cache = JSON.parse(raw);
    return cache.kingsleague?.matches || [];
  } catch (error) {
    console.error('Erro ao carregar Liquipedia cache:', error.message);
    return [];
  }
}

function generateUniqueKey(alert) {
  return [
    alert.jogo,
    alert.time1,
    alert.time2,
    alert.hora,
    alert.dia,
    alert.mes,
    alert.ano,
    alert.evento,
    alert.origem
  ].join('|');
}

export default async function generateAlerts() {
  try {
    const [apiCache, liquipediaKings] = await Promise.all([
      fs.readFile(path.resolve('bot/data', 'api_cache.json'), 'utf8')
        .then(JSON.parse)
        .catch(() => ({})),
      loadLiquipediaKingsMatches()
    ]);

    const previousAlerts = await fs.readFile(
      path.resolve('bot/data', 'AlertasProxPartidasAPI.json'),
      'utf8'
    ).then(data => JSON.parse(data || '[]')).catch(() => []);

    const alertMap = new Map();
    previousAlerts.forEach(alert => {
      alertMap.set(generateUniqueKey(alert), alert.alertaDisparado);
    });

    const allMatches = [
      // Partidas da API
      ...Object.entries(apiCache)
        .filter(([key]) => key !== 'updatedAt')
        .flatMap(([gameKey, gameData]) =>
          (gameData.matches || []).map(match => ({
            ...match,
            jogo: gameKey, // exemplo: 'rocketleague'
            origem: 'api'
          }))
        ),
      // Partidas da Kings League (Liquipedia)
      ...liquipediaKings.map(match => ({
        ...match,
        jogo: 'kingsleague', // 🔧 Corrigido aqui
        origem: 'liquipedia'
      }))
    ];

    const alerts = allMatches.map(match => ({
      jogo: match.jogo,
      time1: match.teamLeft,
      time2: match.teamRight,
      hora: match.time || '--:--',
      dia: match.day || match.dia || '??',
      mes: match.month || match.mes || 'Mês Desconhecido',
      ano: match.year || new Date().getFullYear(),
      evento: match.event,
      stream_original: match.stream_original || match.url || '',
      stream_pt: match.stream_pt || '',
      origem: match.origem,
      _sortKey: createSortKey({
        dia: match.day || match.dia,
        mes: match.month || match.mes,
        ano: match.year,
        hora: match.time
      })
    }));

    const sortedAlerts = alerts.sort((a, b) => a._sortKey - b._sortKey);

    const finalAlerts = sortedAlerts.map(alert => ({
      ...alert,
      alertaDisparado: alertMap.get(generateUniqueKey(alert)) || false
    }));

    const uniqueAlerts = Array.from(new Map(
      finalAlerts.map(alert => [generateUniqueKey(alert), alert])
    ).values());

    await fs.writeFile(
      path.resolve('bot/data', 'AlertasProxPartidasAPI.json'),
      JSON.stringify(uniqueAlerts, null, 2)
    );

    console.log('✅ Alertas ordenados:');
    uniqueAlerts.forEach(a => {
      console.log(`- ${a.dia}/${a.mes} ${a.hora} | ${a.jogo}: ${a.time1} vs ${a.time2}`);
    });

    return uniqueAlerts;
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}
