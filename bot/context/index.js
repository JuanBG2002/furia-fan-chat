import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const MAX_CHARS = parseInt(process.env.GPT_MAX_CHARACTERS || '3200', 10);
const openaiLite = new OpenAI({ apiKey: process.env.OPENAI_KEY });

/** Carrega todo um .txt do diretório /context */
async function readCtx(name){
  const p = path.resolve('bot/context', `${name}.txt`);
  return fs.readFile(p,'utf8');
}

/** Primeiro passo: pergunta a um modelo leve quais contextos precisa */
export async function chooseContexts(userPrompt){
  const quickSystem = `Você recebe uma pergunta de fã da FURIA.
Retorne APENAS um array JSON com os contextos que deve carregar
(dentre: general, organization, cs, kings, rl, pubg, valorant).
NÃO explique nada, só o array.`;

  const r = await openaiLite.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    temperature: 0,
    max_tokens: 20,
    messages: [
      { role: 'system', content: quickSystem },
      { role: 'user', content: userPrompt.slice(0, 400) }
    ]
  });

  try {
    const arr = JSON.parse(r.choices[0].message.content.trim());
    if (!Array.isArray(arr)) throw new Error();
    const result = ['general', ...new Set(arr)];
    console.log(`📦 Contextos carregados: ${result.join(', ')}`);
    return result;
  } catch (e) {
    console.warn('⚠️ Contexto retornado inválido. Usando apenas [general].');
    return ['general'];
  }
}

/** Segundo passo: devolve o prompt FINAL para a resposta */
export async function buildPrompt(userPrompt){
  const ctxList = await chooseContexts(userPrompt);

  let total = '';
  for (const c of ctxList) {
    const txt = await readCtx(c);
    total += `\n\n${txt}`;
    if (total.length > MAX_CHARS) {
      total = total.slice(-MAX_CHARS); // mantém o final
      break;
    }
  }

  total += `\n\n### Pergunta do fã:\n${userPrompt}`;
  return total;
}
