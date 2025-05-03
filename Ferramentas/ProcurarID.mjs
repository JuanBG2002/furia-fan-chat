import axios from 'axios';
import 'dotenv/config';

const token = process.env.PANDASCORE_TOKEN;

if (!token) {
  console.error('❌ PANDASCORE_TOKEN não encontrado no .env');
  process.exit(1);
}

const teamName = process.argv[2] || 'FURIA'; // você pode trocar no terminal

const api = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'FuriaFanBot/1.0',
  },
});

const searchTeam = async (name) => {
  try {
    const { data } = await api.get('/csgo/teams', {
      params: { 'search[name]': name },
    });

    if (!data.length) {
      console.warn(`❌ Nenhum time encontrado com o nome "${name}"`);
      return;
    }

    console.log(`🔍 Resultados para "${name}":\n`);
    data.forEach(team => {
      console.log(`• ID: ${team.id}`);
      console.log(`  Nome: ${team.name}`);
      console.log(`  Acrônimo: ${team.acronym}`);
      console.log(`  Slug: ${team.slug}`);
      console.log(`  URL: ${team.url}`);
      console.log('---');
    });
  } catch (err) {
    console.error('❌ Erro ao buscar na API:', err.response?.data || err.message);
  }
};

searchTeam(teamName);
