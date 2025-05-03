# 🐆 FURIA Fan Chat

**FURIA Fan Chat** é um bot avançado de Telegram desenvolvido para acompanhar todas as modalidades da FURIA Esports, incluindo CS2, Valorant, Rocket League, PUBG, Rainbow Six, League of Legends e Kings League. Com integração via API (PandaScore) e scraping (Liquipedia), o bot oferece monitoramento ao vivo, calendários de partidas e torneios, notificações e um modo de conversa com GPT para torcedores.

## 🚀 Funcionalidades

- 📅 Próxima partida por jogo
- 👾 Monitoramento ao vivo com fallback seguro
- 🎯 Calendário de campeonatos e partidas
- 🔔 Notificações personalizadas por usuário e jogo
- 🧠 Modo GPT com base em contexto da FURIA
- 🌐 Menus interativos por jogo e fonte (API/Scraping)
- 🛠️ Sistema de cache e logs
- ⚙️ Alternância de fonte de dados (API, Scraping, Ambos)
- 📦 Modularizado e extensível

## 📁 Estrutura dos Arquivos

- `bot/` – Comandos e lógica principal do Telegraf
- `helpers/` – Formatação, logger, menus e funções auxiliares
- `services/` – Integração com APIs e scraping
- `state/` – Controle de fonte e cache
- `data/` – Arquivos JSON de persistência
- `context/` – Blocos de contexto para o modo GPT
- `ferramentas/` – Scripts utilitários (listagem, backup, organização)
- `.env` – Configurações sensíveis (tokens, IDs, modos)
- `package.json` – Dependências e scripts do projeto

## 📦 Instalação

```bash
git clone https://github.com/seuuser/furia-fan-chat
cd furia-fan-chat
npm install
cp .env.exemplo .env
# Edite .env com suas credenciais
npm start
```

## ⚙️ Variáveis `.env` obrigatórias

```env
BOT_TOKEN=seu_token_do_bot
PANDASCORE_TOKEN=seu_token_pandascore
FURIA_TEAM_ID_CS=126689
FURIA_TEAM_ID_VALORANT=...
FURIA_TEAM_ID_LOL=...
FURIA_TEAM_ID_RL=...
FURIA_TEAM_ID_PUBG=...
FURIA_TEAM_ID_R6SIEGE=...
SOURCE=3 # 1=API, 2=Scraping, 3=Ambos
```

## 🧪 Scripts e Ferramentas Extras

Localizados em `ferramentas/`:

- `listarScripts.mjs` – Exporta todos os scripts com caminhos
- `removerDuplicatas.js` – Limpeza de dados redundantes
- `atualizarCalendarios.js` – Atualização dos caches de partidas

## 📚 Contexto para o GPT

Blocos em `context/` alimentam o modo GPT do bot com informações atualizadas sobre:

- Organização FURIA
- Modalidades e line-ups
- Criadores de conteúdo
- Regras e diretrizes de resposta

## 📖 Comandos principais do Bot

- `/start` – Menu inicial com escolha de fonte e jogo
- `/gpt` – Ativa modo conversa
- `/sair` – Encerra o modo conversa

## 🧠 Estrutura GPT

Responde com base em:

- Arquivos contextuais por jogo
- Cache atualizado de partidas/títulos
- Logs de interação e preferências de fonte

## 📄 Licença

Distribuído para fins de aprendizado, uso interno e demonstração. Todos os direitos da marca FURIA pertencem à organização original.
