/* ../helpers/formatacao.js */

// Constantes compartilhadas
export const MONTHS_PT = {
    Jan: 'Janeiro', Feb: 'Fevereiro', Mar: 'Março', Apr: 'Abril',
    May: 'Maio', Jun: 'Junho', Jul: 'Julho', Aug: 'Agosto',
    Sep: 'Setembro', Oct: 'Outubro', Nov: 'Novembro', Dec: 'Dezembro'
  };

  export const FULL_MONTHS_PT = {
    January: 'Janeiro',
    February: 'Fevereiro',
    March: 'Março',
    April: 'Abril',
    May: 'Maio',
    June: 'Junho',
    July: 'Julho',
    August: 'Agosto',
    September: 'Setembro',
    October: 'Outubro',
    November: 'Novembro',
    December: 'Dezembro'
  };

  export const mesParaNumero = {
    Janeiro: 0, Fevereiro: 1, Março: 2, Abril: 3, Maio: 4, Junho: 5,
    Julho: 6, Agosto: 7, Setembro: 8, Outubro: 9, Novembro: 10, Dezembro: 11
  };
  
  export const GAMES = {
    CS   : { key: 'counterstrike',   label: 'Counter Strike',    icon: '💥' },
    LOL  : { key: 'leagueoflegends', label: 'League of Legends', icon: '🐉' },
    R6   : { key: 'rainbowsix',      label: 'Rainbow Six',       icon: '🔫' },
    RL   : { key: 'rocketleague',    label: 'Rocket League',     icon: '🚗' },
    PUBG : { key: 'pubg',            label: 'PUBG',              icon: '🪖' },
    VAL  : { key: 'valorant',        label: 'Valorant',          icon: '🎯' },
    KINGS  : { key: 'kingsleague',        label: 'KingsLeague',          icon: '🎯' }
  };
  
  export const abreviacoes = {
    counterstrike: 'CS',
    leagueoflegends: 'LOL',
    rainbowsix: 'R6',
    rocketleague: 'RL',
    pubg: 'PUBG',
    valorant: 'VAL'
  };
  
  // Funções de formatação
  export function formatFullDate(dateStr = '') {
    const match = dateStr.match(/([A-Za-z]{3}) (\d{1,2}), (\d{4})/);
    if (!match) return dateStr;
    const month = MONTHS_PT[match[1]];
    const day   = match[2].padStart(2, '0');
    const year  = match[3];
    return `${day} de ${month} de ${year}`;
  }
  
  export function formatTournamentDate(dateStr = '') {
    const cleaned = dateStr
      .replace(/^ONGOING!?\s*/i, '') // Remove "ONGOING"
      .replace(/\s*-\s*\d{1,2}:\d{2}$/, '') // Remove horário
      .trim();
  
    // Converte "May 1, 2025" para "1 de Maio de 2025"
    const match = cleaned.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
    
    if (match) {
      const [, monthEn, day, year] = match;
      const monthPt = FULL_MONTHS_PT[monthEn] || monthEn;
      return `${parseInt(day)} de ${monthPt} de ${year}`;
    }
    
    return cleaned; // Fallback para formato original se não reconhecer
  }

  export function sortTournaments(tournaments = []) {
    return tournaments.sort((a, b) => {
      const dateA = new Date(a.date.replace(/ - \d{2}:\d{2}$/, ''));
      const dateB = new Date(b.date.replace(/ - \d{2}:\d{2}$/, ''));
      return dateA - dateB;
    });
  }


  export function formatDateToBR(raw = '') {
    if (!raw.includes('-')) return raw;
    const [monthEng, day, yearTime] = raw.replace(',', '').split(' ');
    const [year, time] = yearTime.split(' - ');
    return `${day.padStart(2, '0')}/${MONTHS_PT[monthEng] ? MONTHS_PT[monthEng].slice(0, 2) : '??'}/${year} ${time || ''}`.trim();
  }
  
  export function normalizeTeamName(name = '') {
    return name.trim().toUpperCase() === 'FUR' ? 'FURIA' : name.trim();
  }
  
  export function cleanTournamentDate(date = '') {
    return date.replace(/^.*?UTC/, '').replace(/^ONGOING!?/, '').trim();
  }
  
  export function formatDateRange(raw = '') {
    const cleaned = raw.replace(/^ONGOING!?/, '').trim();
    const match = cleaned.match(/([A-Za-z]{3}) (\d{1,2}) - ([A-Za-z]{3}) (\d{1,2})/);
    if (!match) return translateMonthNames(cleaned);
    const d1 = match[2].padStart(2, '0');
    const d2 = match[4].padStart(2, '0');
    const m1 = MONTHS_PT[match[1]];
    const m2 = MONTHS_PT[match[3]];
    return `${d1} de ${m1} a ${d2} de ${m2}`;
  }
  
  export function formatLongDate(raw = '') {
    const match = raw.match(/([A-Za-z]{3}) (\d{1,2}), (\d{4})/);
    if (!match) return translateMonthNames(raw);
    const [_, mon, day, year] = match;
    const dia = day.padStart(2, '0');
    const mes = MONTHS_PT[mon];
    return `${dia} de ${mes} de ${year}`;
  }

  export function translateMonthNames(text = '') {
    return text.replace(/\b([A-Za-z]{3})\b/g, (m) => MONTHS_PT[m] || m);
  }
  
  export function formatTime(str = '') {
    const match = str.match(/(\d{1,2}:\d{2})(?:\s*[AP]M)?$/i);
    return match ? match[1] : '--:--';
  }
  
  export function formatSimpleDate(str = '') {
    const match = str.match(/([A-Za-z]{3}) (\d{1,2}), (\d{4})/);
    if (!match) return 'Data inválida';
    const day = match[2].padStart(2, '0');
    const month = MONTHS_PT[match[1]];
    const year = match[3];
    return `${day} de ${month} de ${year}`;
  }
  