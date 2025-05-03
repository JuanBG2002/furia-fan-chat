import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE = process.env.SOURCE?.trim() || '2';
const SLUG = process.env.LIQUIPEDIA_TEAM_SLUG;

const GAMES = {
  counterstrike: 'https://liquipedia.net/counterstrike/',
  leagueoflegends: 'https://liquipedia.net/leagueoflegends/',
  rainbowsix: 'https://liquipedia.net/rainbowsix/',
  rocketleague: 'https://liquipedia.net/rocketleague/',
  pubg: 'https://liquipedia.net/pubg/',
  valorant: 'https://liquipedia.net/valorant/'
};

const OUTPUT_FILE = './bot/data/liquipedia_cache.json';
fs.mkdirSync('./bot/data', { recursive: true });

export async function updateLiquipedia() {
  if (SOURCE === '1') {
    console.log('🛑 Scraping ignorado: SOURCE=API');
    return;
  }

  if (!SLUG) throw new Error('LIQUIPEDIA_TEAM_SLUG não definido no .env');

  const cache = { updatedAt: new Date().toISOString() };

  for (const [game, base] of Object.entries(GAMES)) {
    const url = `${base}${SLUG}`;
    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (FURIA Bot)',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const $ = cheerio.load(html);
      const matches = scrapeUpcomingMatches($);
      let tournaments = scrapeUpcomingTournaments($);

      if (matches.length > 0 && tournaments.length === 0) {
        const m = matches[0];
        if (m.day && m.month && m.year) {
          tournaments.push({
            name: m.event || 'Evento desconhecido',
            day: m.day,
            month: m.month,
            year: m.year,
            endsAt: null,
            ongoing: true
          });
        }
      }

      cache[game] = { matches, tournaments };
      console.log(`✅ ${game} OK – ${matches.length} partidas, ${tournaments.length} torneios`);
    } catch (err) {
      console.error(`❌ ${game} falhou:`, err.message);
      cache[game] = { matches: [], tournaments: [] };
    }
  }

  try {
    const kingsURL = 'https://kingsleague.pro/en/teams/50-furia-fc';
    const { data: html } = await axios.get(kingsURL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (FURIA Bot)' }
    });
    const $ = cheerio.load(html);
    const matches = [];

    $('.card-match').each((_, el) => {
      const $el = $(el);
      const homeScore = $el.find('.home-team-result-wrapper').text().trim();
      const awayScore = $el.find('.away-team-result-wrapper').text().trim();

      if (homeScore === '-' || awayScore === '-') {
        const dateStr = $el.closest('.turn-wrapper').find('.turn-date').text().trim();
        const rawHour = $el.find('.match-hour').text().trim();
        const time = extractTime(rawHour);

        const teams = $el.find('.team-short-name').map((_, t) => $(t).text().trim()).get();
        const matchUrl = $el.find('a.match-data-wrapper').attr('href');

        const { day, month, year } = parseKingsDate(dateStr);

        matches.push({
          teamLeft: teams[0],
          score: '',
          format: '',
          teamRight: teams[1],
          time,
          event: 'Kings League Brasil 2025',
          url: `https://kingsleague.pro${matchUrl}`,
          day,
          month,
          year
        });
      }
    });

    cache.kingsleague = { matches, tournaments: [] };
    console.log(`✅ kingsleague OK – ${matches.length} partidas`);
  } catch (err) {
    console.error('❌ kingsleague falhou:', err.message);
    cache.kingsleague = { matches: [], tournaments: [] };
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  console.log('📦 Cache salvo em', OUTPUT_FILE);
}

function scrapeUpcomingMatches($) {
  const matches = [];
  const header = $('div.infobox-header').filter((_, el) => $(el).text().trim() === 'Upcoming Matches');
  const container = header.closest('.fo-nttax-infobox.panel');
  const table = container.find('table.infobox_matches_content').first();
  const rows = table.find('tr');

  for (let i = 0; i < rows.length; i += 2) {
    const teams = $(rows[i]);
    const details = $(rows[i + 1]);

    const rawDate = details.find('.timer-object').text().trim();
    const { day, month, year, time } = parseMatchDate(rawDate);

    matches.push({
      teamLeft: teams.find('td.team-left  .team-template-text').text().trim(),
      score: teams.find('td.versus-upper').text().trim(),
      format: teams.find('td.versus-lower').text().trim(),
      teamRight: teams.find('td.team-right .team-template-text').text().trim(),
      time,
      event: details.find('.tournament-text-flex a').text().trim(),
      day,
      month,
      year
    });
  }

  return matches;
}

function scrapeUpcomingTournaments($) {
  const tournaments = [];
  $('div.infobox-header:contains("Upcoming Tournaments")')
    .parent()
    .nextAll('table.infobox_matches_content')
    .each((_, table) => {
      const name = $(table).find('tr').first().text().trim();
      const rawDate = $(table).find('tr').eq(1).find('td').text().trim();
      const { day, month, year, endsAt, ongoing } = parseTournamentDate(rawDate);
      tournaments.push({ name, day, month, year, endsAt, ongoing });
    });
  return tournaments;
}

function translateMonth(m) {
  const mMap = {
    Jan: 'Janeiro', Feb: 'Fevereiro', Mar: 'Março', Apr: 'Abril',
    May: 'Maio', Jun: 'Junho', Jul: 'Julho', Aug: 'Agosto',
    Sep: 'Setembro', Oct: 'Outubro', Nov: 'Novembro', Dec: 'Dezembro'
  };
  return mMap[m] || null;
}

function parseMatchDate(raw) {
  const parts = raw.match(/([A-Za-z]{3,}) (\d{1,2}), (\d{4}) - (\d{1,2}:\d{2})/);
  if (!parts) return { day: null, month: null, year: null, time: raw };

  return {
    day: String(parseInt(parts[2])).padStart(2, '0'),
    month: translateMonth(parts[1].slice(0, 3)),
    year: parseInt(parts[3]),
    time: parts[4]
  };
}

function parseKingsDate(dateStr) {
  const parts = dateStr.match(/([A-Za-z]+), ([A-Za-z]+) (\d{1,2})/);
  if (!parts) return { day: null, month: null, year: null };

  const month = translateMonth(parts[2].slice(0, 3));
  return {
    day: String(parseInt(parts[3])).padStart(2, '0'),
    month,
    year: 2025
  };
}

function parseTournamentDate(raw) {
  const result = {
    day: null,
    month: null,
    year: null,
    endsAt: null,
    ongoing: false
  };

  if (!raw) return result;

  if (raw.startsWith('ONGOING!')) {
    result.ongoing = true;
    raw = raw.replace('ONGOING!', '').trim();
  }

  const rangeMatch = raw.match(/^([A-Za-z]{3}) (\d{1,2}) - ([A-Za-z]{3}) (\d{1,2})$/);
  if (rangeMatch) {
    result.day = String(parseInt(rangeMatch[2])).padStart(2, '0');
    result.month = translateMonth(rangeMatch[1]);
    result.year = 2025;
    result.endsAt = `${String(parseInt(rangeMatch[4])).padStart(2, '0')} de ${translateMonth(rangeMatch[3])}`;
    return result;
  }

  const fullMatch = raw.match(/(\d{4})-\d{2}-\d{2}.*UTC([A-Za-z]{3}) (\d{1,2})(?: - (\d{1,2}))?/);
  if (fullMatch) {
    const [, year, monthStr, startDay, endDay] = fullMatch;
    result.day = String(parseInt(startDay)).padStart(2, '0');
    result.month = translateMonth(monthStr);
    result.year = parseInt(year);
    if (endDay) result.endsAt = `${String(parseInt(endDay)).padStart(2, '0')} de ${translateMonth(monthStr)}`;
    return result;
  }

  return result;
}

function extractTime(text = '') {
  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '--:--';
  let [_, h, m, period] = match;
  h = parseInt(h);
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}
