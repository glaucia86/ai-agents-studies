import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'; 
import { AzureKeyCredential } from '@azure/core-auth';
import * as dotenv from 'dotenv';

dotenv.config();

async function callLLM(prompt: string): Promise<string> {
  const token = process.env.GROK_GITHUB_MODEL_TOKEN

  if (!token) {
    throw new Error('Token de autenticação não encontrado. Verifique a variável de ambiente GROK_GITHUB_MODEL_TOKEN.');
  }

  const endpoint = process.env.GROK_GITHUB_MODEL_ENDPOINT||'';
  const modelName = "xai/grok-3-mini";

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token)
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "Sou um assistente de IA treinado para responder perguntas."},
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      top_p: 1.0,
      model: modelName,
    }
  });

  if (isUnexpected(response)) {
    throw new Error(`Erro da API: ${JSON.stringify(response.body.error)}`);
  }

  const content = response.body.choices[0].message?.content;

  if(!content) {
    throw new Error('Resposta inesperada do modelo: conteúdo vazio.');
  }

  return content;
}

callLLM("Qual é a capital da França?")
  .then(response => console.log("Resposta...: ", response))
  .catch(error => console.error("Erro...: ", error));