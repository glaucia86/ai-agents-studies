import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.OPEN_API_GITHUB_MODEL_TOKEN;

if (!token) {
  throw new Error("Token de autenticação não encontrado. Certifique-se de definir a variável de ambiente OPEN_API_GITHUB_MODEL_TOKEN.");
}

const endpoint = 'https://models.github.ai/inference';
const modelName = 'openai/gpt-4o';

async function callLLM(prompt: string): Promise<string> {
  const client = new OpenAI({
    baseURL: endpoint,
    apiKey: token,
  });

  const responseLLM = await client.chat.completions.create({
    messages: [
      { role: 'system', content:'Você é um assistente treinado para responder perguntas!' },
      { role: 'user', content: prompt  }
    ],
    temperature: 0.7,
    model: modelName,
    max_completion_tokens: 500,
    top_p: 1.0,
  });

  if (!responseLLM) {
    throw new Error("Resposta do LLM não recebida.");
  }

  const content = responseLLM.choices[0].message?.content;

  if (!content) {
    throw new Error("Conteúdo da resposta do LLM não encontrado.");
  }

  return content;
}

callLLM("Qual é a capital da França?")
  .then(response => console.log("Resposta do LLM...: ", response))
  .catch(error => console.error("Erro ao chamar o LLM...: ", error));