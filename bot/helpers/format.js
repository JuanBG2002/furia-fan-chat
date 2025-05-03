/** Formata eventos recebidos da PandaScore (ou simulados) */
export function formatEvent (ev) {
    if (ev.type === 'kill')         return `☠️ ${ev.player} matou ${ev.target}`;
    if (ev.type === 'bomb_planted') return '💣 Bomba plantada!';
    if (ev.type === 'win_round')    return `🏆 Round para ${ev.winner}`;
    return `🎯 ${ev.type}`;
  }
  