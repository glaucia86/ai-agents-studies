import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const token = process.env.OPEN_API_GITHUB_MODEL_TOKEN;
const endpoint = process.env.OPEN_API_GITHUB_MODEL_ENDPOINT || "https://models.github.ai/inference";
const modelName = 'openai/gpt-4o';

if (!token) {
  throw new Error('Missing OpenAI API token');
}

const client = new OpenAI({
  baseURL: endpoint,
  apiKey: token
});

async function testBasicAPI(): Promise<void> {
  console.log('Testando conexão básica com o GitHub Models...');

  try {
    const output = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user', content: 'A capital da França é'
        }
      ],
      stream: false,
      max_completion_tokens: 20
    });

    console.log('Resposta...: ', output.choices[0].message.content);
  } catch (error) {
    console.log('Erro na conexão com o GitHub Models:', error);
    throw error;
  }
}

const SYSTEM_PROMPT = `Responda as seguintes perguntas da melhor forma possível. Você tem acesso às seguintes ferramentas: 

  get_weather: Obter o clima atual em uma determinada localização.

  A forma de usar as ferramentas é especificando um blob json. 
  Especificamente, este json deve ter uma chave \`action\` (com o nome da ferramenta a usar) e uma chave \`action_input\` (com a entrada para a ferramenta aqui).

  Os únicos valores que devem estar no campo "action" são:
  get_weather: Obter o clima atual em uma determinada localização, args: { "location": { "type": string }}
  exemplo de uso:
  \`\`\`
  {
    "action": "get_weather",
    "action_input": {"location": "New York"}
  }
  \`\`\`

  SEMPRE use o seguinte formato:

  Question: a pergunta de entrada que você deve responder
  Thought: você deve sempre pensar sobre uma ação a tomar. Apenas uma ação por vez neste formato:
  Action:
  \`\`\`
  {
    "action": "get_weather",
    "action_input": {"location": "New York"}
  }
  \`\`\`

  Observation: o resultado da ação. Esta Observação é única, completa e a fonte da verdade.
  ... (este Thought/Action/Observation pode se repetir N vezes, você deve dar várias etapas quando necessário. O $JSON_BLOB deve ser formatado como markdown e usar apenas uma ÚNICA ação por vez.)

  Você deve sempre terminar sua saída com o seguinte formato:

  Thought: Agora sei a resposta final
  Final Answer: a resposta final para a pergunta de entrada original

  Agora comece! Lembrete para SEMPRE usar os caracteres exatos \`Final Answer:\` quando fornecer uma resposta definitiva.
`;

function getWeather(location: string): string {
  return `o clima em ${location} está ensolarado com temperaturas baixas.\n`;
}

async function demonstrateHallucinationProblem(): Promise<string> {
  console.log('\n DEMONSTRAÇÃO DO PROBLEMA DE ALUCINAÇÃO');
  console.log('=' .repeat(60));

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: "Qual é o clima em Londres?" }
  ];

  console.log('\n Mensagens enviadas:');
  console.log('System prompt length:', SYSTEM_PROMPT.length);
  console.log('User question:', messages[1].content);

  console.log('\n PRIMEIRO TESTE - SEM STOP (vai alucinar):');

  try {
    const output = await client.chat.completions.create({
      model: modelName,
      messages: messages,
      stream: false,
      max_completion_tokens: 200,
    });

    console.log('Resposta completa (com alucinação):');
    console.log(output.choices[0].message.content);
    console.log('\n Viu o problema? O modelo inventou a "Observation"!');

    return output.choices[0].message.content || '';

  } catch (error) {
    console.log('Error:', error);
    return '';
  }
}

async function demonstrateStopSolution(): Promise<void> {
  console.log('\n SOLUÇÃO COM STOP - MUITO MELHOR!');
  console.log('=' .repeat(60));

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: "Qual é o clima em Londres?" }
  ];

  console.log('\n SEGUNDO TESTE - COM STOP (para antes da Observation):');

  try {
    const output = await client.chat.completions.create({
      model: modelName,
      messages: messages,
      max_completion_tokens: 150,
      stop: ["Observation:"]
    });

    console.log('Resposta parada antes da Observation:');
    console.log(output.choices[0].message.content);
    console.log('\n Muito melhor! Agora podemos executar a função real.');

  } catch (error) {
    console.log('Error:', error);
  }
}

async function completeAgentFlow(): Promise<void> {
  console.log('\n FLUXO COMPLETO DO AGENT');
  console.log('=' .repeat(60));

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: "Qual é o clima em Londres?" }
  ];

  try {
    console.log('\n PASSO 1: Gerando Thought + Action (parando antes da Observation)');
    const output = await client.chat.completions.create({
      model: modelName,
      messages: messages,
      max_completion_tokens: 150,
      stop: ["Observation:"]
    });

    const partialResponse = output.choices[0].message.content || '';
    console.log('Resposta parcial');
    const weatherResult = getWeather('Londres');
    console.log('Resultado da função', weatherResult.trim());

    console.log('\n PASSO 3: Concatenando resposta + resultado da função');
    const completeAssistantMessage = partialResponse + '\nObservation: ' + weatherResult + '\n';

    const updatedMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: "Qual é o clima em Londres?" },
      { role: 'assistant', content: completeAssistantMessage }
    ];

    console.log('\nMensagem completa do assistant:');
    console.log(completeAssistantMessage);

    console.log('\n PASSO 4: Gerando resposta final');
    const finalOutput = await client.chat.completions.create({
      model: modelName,
      messages: updatedMessages,
      stream: false,
      max_completion_tokens: 200,
    });

    console.log('\n RESPOSTA FINAL:');
    console.log(finalOutput.choices[0].message.content);
  } catch (error) {
    console.error('Erro no fluxo completo:', error);
  }
}

function parseAction(content: string): { action: string; action_input: any } | null {
  try {
    // Procurar por JSON entre ``` 
    const jsonMatch = content.match(/```\s*(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    }
    return null;
  } catch (error) {
    console.error('Erro ao fazer parse da ação:', error);
    return null;
  }
}

// Função de demonstração com parser
async function demonstrateWithParser(): Promise<void> {
  console.log('\n DEMONSTRAÇÃO COM PARSER DE AÇÕES');
  console.log('=' .repeat(60));

  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "Qual é o clima em São Paulo e no Rio de Janeiro?" }
  ];

  try {
    // Primeira chamada
    const output = await client.chat.completions.create({
      model: modelName,
      messages: messages,
      max_tokens: 200,
      stop: ["Observation:"]
    });

    const response = output.choices[0].message.content || '';
    console.log('Resposta do LLM:');
    console.log(response);

    // Fazer parse da ação
    const action = parseAction(response);
    if (action) {
      console.log('\n Ação parseada:');
      console.log('Ferramenta:', action.action);
      console.log('Parâmetros:', action.action_input);

      // Executar ferramenta
      if (action.action === 'get_weather') {
        const result = getWeather(action.action_input.location);
        console.log('\n  Resultado da ferramenta:');
        console.log(result.trim());
      }
    } else {
      console.log('Não foi possível fazer parse da ação');
    }

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função principal de demonstração
async function main(): Promise<void> {
  console.log('DUMMY AGENT LIBRARY - GITHUB MODELS');
  console.log('Adaptado do Hugging Face Agents Course');
  console.log('=' .repeat(80));

  try {
    // 1. Teste básico da API
    await testBasicAPI();

    // 2. Demonstrar problema da alucinação
    await demonstrateHallucinationProblem();

    // 3. Demonstrar solução com stop
    await demonstrateStopSolution();

    // 4. Fluxo completo do agent
    await completeAgentFlow();

    // 5. Exemplo com parser
    await demonstrateWithParser();

    console.log('\n CONCLUSÃO:');
    console.log('Aprendemos como criar Agents do zero usando código TypeScript,');
    console.log('e vimos como esse processo pode ser tedioso. Felizmente, muitas');
    console.log('bibliotecas de Agentes simplificam esse trabalho lidando com muito');
    console.log('do trabalho pesado para você.');
    console.log('\nAgora estamos prontos para criar nosso primeiro Agent real usando smolagents!');

  } catch (error) {
    console.error('Erro na demonstração principal:', error);
    console.log('\n VERIFICAR:');
    console.log('1. Arquivo .env existe?');
    console.log('2. OPEN_API_GITHUB_MODEL_TOKEN está definido?');
    console.log('3. Token é válido para GitHub Models?');
  }
}

// Executar demonstração
if (require.main === module) {
  main();
}

export { 
  client, 
  getWeather, 
  parseAction, 
  SYSTEM_PROMPT,
  completeAgentFlow 
};




