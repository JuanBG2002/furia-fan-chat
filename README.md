# 🐆 FURIA Fan Chat

**FURIA Fan Chat** é um bot avançado de Telegram desenvolvido para acompanhar em tempo real todas as modalidades da FURIA Esports, incluindo CS2, Valorant, Rocket League, PUBG, Rainbow Six, League of Legends e Kings League. Com integração via API (PandaScore) e scraping (Liquipedia), o bot oferece monitoramento ao vivo, calendários de partidas e torneios, notificações e um modo de conversa com GPT para torcedores.

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
git clone https://github.com/JuanBG2002/furia-fan-chat
cd furia-fan-chat
npm install
# Edite .env com suas credenciais
npm run dev
```

## ⚙️ Variáveis `.env` obrigatórias

```env
BOT_TOKEN= #Bot do telegram, BotFather

PANDASCORE_TOKEN=
API_INTERVAL_MINUTES=10 #Intervalo que o cache da API vai se atualizar
FURIA_TEAM_ID=124530 #Team ID PandaScore Furia = 124530
FURIA_TEAM_ID_VALORANT=128477 #Team ID PandaScore Furia = 128477
FURIA_TEAM_ID_LOL=126688 #Team ID PandaScore Furia = 126688
FURIA_TEAM_ID_RL=128933 #Team ID PandaScore Furia = 128933
FURIA_TEAM_ID_PUBG=126886 #Team ID PandaScore Furia = 126886
FURIA_TEAM_ID_R6SIEGE=127596 #Team ID PandaScore Furia = 127596
ALERT_CHECK_INTERVAL_MINUTES=1 #Intervalo que o bot vai verificar se tem notificações para disparar
OPENAI_KEY=
GPT_DAILY_LIMIT=20 #Limite de mensagens que cada user pode mandar par ao GPT por dia
GPT_MAX_CHARACTERS=3200 #Máximo de caracteres que cada user pode mandar par ao GPT por dia
LIQUIPEDIA_INTERVAL_MINUTES=15 #Intervalo que o Script vai fazer scrape das páginas da Liquipedia
LIQUIPEDIA_TEAM_SLUG=FURIA #Final URL da Liquipedia
FURIA_STORE_URL=https://furia.gg
FURIA_FANS_CHAT=https://t.me/csgo #Não existe ainda, csgo como placeholder
DEBUG=true #Ativa comentários no terminal
SOURCE=2 #Define fonte das informações: 
#1 = apenas Api (Pandascore) Não tem informações sobre KingsLeague nem próximos campeonatos, mas não utiliza scraping (Não recomendado) Usa caching, não atualiza a cada requisição
#2 = (Recomendado) Scrape + Api faz scrape das páginas web (Liquipedia e KingsLeague) para obter informações (Feita de tempo em tempo configurável, caching, não à cada requisição) Obs. Acompanhar ao vivo e URL de partidas ainda utiliza API do PandaScore pois o Liquipedia tem informações limitadas nesse quesito e não disponibiliza link de transmissão direto
#3 = Escolher no inicio do chat, dá a opção de escolher no inicio do bot qual fonte que usar (Para debug/testes)
```

## 📚 Contexto para o GPT

Blocos em `context/` alimentam o modo GPT do bot com informações atualizadas sobre:

- Organização FURIA
- Informações relevantes para cada jogo que a FURIA joga
- Regras e diretrizes de resposta

## 🔍 Detalhamento das Funcionalidades

Backend
API: Bot criar um cache em um intervalo configurado no .env (API_INTERVAL_MINUTES=10) informando as próximas partidas do time, pesquisando a partida e adicionando também o URL da partida se já tiver (Stream oficial e Stream PTBR). Cria também um JSON de alertas que define as próximas partidas em sequência para posteriormente ser usado no sistema de notificação do usuário.

Scrape: Funciona em paralelo com a API (A não ser que .env SOURCE=1) para obter mais informações indisponíveis na API, como próximos campeonatos e detalhes sobre KingsLeague (scrape no Liquipedia e KingsLeague). Também utilizando cache com intervalo definido o .env (LIQUIPEDIA_INTERVAL_MINUTES=15).
  Passa à permitir detalhe sobre jogos KingsLeague, Próximos campeonatos, Calendário de partidas, Calendário de campeonatos e mostrar próximo campeonato caso não tenha partida agendada.

Notificações: Timer de análise de alerta de próximas partidas para notificar os usuários cadastrados, intervalo configurável no .env (ALERT_CHECK_INTERVAL_MINUTES=1).

📅 Próxima partida por jogo
O bot consulta a API PandaScore (arquivo cache, não api em cada requisição) ou via scraping na Liquipedia/KingsLeague (arquivo cache, não em cada requisição) e exibe, por jogo, a próxima partida confirmada da FURIA com data, horário e adversário. O usuário escolhe o jogo no menu interativo ou para ver um calendário completo para todos os jogos (Somendo no modo scrape .env SOURCE=2)

👾 Monitoramento ao vivo com fallback seguro
Detecta automaticamente partidas em andamento da FURIA, se tiver, mostra detalhes importantes incluindo pontuação atual e link de Stream (Oficial e PTBR)
Opção de receber atualizações movimentação por movimentação, mas é necessário API PandaScore Pro no .env

🎯 Próximos campeonatos (Apenas modo scraping .env SOURCE=2)
Mostra os próximos torneios confirmados para cada modalidade, com nome, datas e status (em andamento, futuros, etc). Opção de ver por jogo ou calendário completo 

🔔 Notificações personalizadas por usuário e jogo
Cada usuário pode configurar alertas para receber notificações automáticas quando partidas começarem. As preferências são salvas por ID e jogo (Opção de ativar e desativar por jogo ou para todos), e o bot verifica em ciclos definidos via .env.

🧠 Modo GPT com base em contexto da FURIA
Ao ativar o modo conversa, o fã pode dialogar com o bot com linguagem natural. 
Para maior eficiencia, já que a API do GPT não consegue pesquisar assuntos recentes, o GPT responde com base nos arquivos context/ com dados atuais, separados para cada jogo, prompt base e diretrizes, o proprio GPT decide quais contextos precisa para responder o User e não ter que enviar toda a database em cada requisição, economizando TOKENS

🛠️ Sistema de cache e logs
Os dados obtidos das fontes externas são armazenados em arquivos JSON (api_cache.json, liquipedia_cache.json) e atualizados em intervalos definidos. Isso reduz consumo de API e melhora performance.
Se no .env o DEBUG=true, retorna varios logs para manutenção

⚙️ Alternância de fonte de dados (API, Scraping, Ambos)
O bot pode operar com:

API apenas (não usa scraping, mas é limitado);

Scraping apenas (mais completo, inclui Kings League, campeonatos e calendário);

📦 Modularizado e extensível
Todo o código segue estrutura modular, com comandos, serviços, helpers e contextos separados por função. É fácil adicionar novos jogos, comandos ou menus sem afetar os já existentes.


## 📄 Licença

Distribuído para fins de aprendizado, uso interno e demonstração. Todos os direitos da marca FURIA pertencem à organização original.
