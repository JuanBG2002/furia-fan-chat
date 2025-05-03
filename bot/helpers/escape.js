export function escapeMarkdownV2 (text = '') {
    return text
      .replace(/([_\*\[\]\(\)~`>#+=|{}.!\\\-])/g, '\\$1');  // Escapa todos os especiais
  }
  