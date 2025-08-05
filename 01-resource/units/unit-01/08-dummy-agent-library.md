# Biblioteca de Agente Dummy (Do Zero)

## Planejamento da Unidade 1

Este curso é **framework-agnóstico** porque queremos focar nos conceitos de agentes de IA e evitar nos emaranhamos nas especificidades de um framework particular.

Além disso, queremos que os estudantes sejam capazes de usar os conceitos que aprendem neste curso em seus próprios projetos, usando qualquer framework que gostem.

Portanto, para esta Unidade 1, usaremos uma **biblioteca de agente dummy** e uma API serverless simples para acessar nosso motor LLM.

Você provavelmente não usaria essas em produção, mas elas servirão como um bom ponto de partida para entender como os agentes funcionam.

Após esta seção, você estará pronto para criar um Agente simples usando smolagents.

E nas Unidades seguintes também usaremos outras bibliotecas de Agentes de IA como LangGraph e LlamaIndex.

Para manter as coisas simples, usaremos funções TypeScript simples como Tools e Agent.

Usaremos pacotes built-in do Node.js e algumas bibliotecas comuns para que você possa experimentar em qualquer ambiente.

## API Serverless

No ecossistema Hugging Face, há um recurso conveniente chamado **API Serverless** que permite executar facilmente inferência em muitos modelos. Não há instalação ou implantação necessária.

### Configuração Inicial em TypeScript

```typescript
// Instalação necessária:
// npm install @huggingface/inference axios dotenv
// npm install -D @types/node

import { HfInference } from '@huggingface/inference';
import * as dotenv from 'dotenv';

dotenv.config();

// Você precisa de um token de https://hf.co/settings/tokens
// Certifique-se de selecionar 'read' como tipo de token
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  throw new Error('HF_TOKEN não encontrado nas variáveis de ambiente');
}

const client = new HfInference(HF_TOKEN);
```

### Teste Básico da API

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function testBasicChat(): Promise<void> {
  try {
    const response = await client.chatCompletion({
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: [
        { role: "user", content: "A capital da França é" }
      ],
      max_tokens: 20,
      stream: false
    });

    console.log(response.choices[0].message.content);
    // Output: Paris.
  } catch (error) {
    console.error('Erro na chamada da API:', error);
  }
}
```

O método `chatCompletion` é o método **RECOMENDADO** para usar a fim de garantir uma transição suave entre modelos.

## Agente Dummy

Nas seções anteriores, vimos que o núcleo de uma biblioteca de agentes é anexar informações no system prompt.

Este system prompt é um pouco mais complexo do que o que vimos anteriormente, mas já contém:

- **Informações sobre as ferramentas**
- **Instruções do ciclo** (Thought → Action → Observation)

```typescript
// System prompt mais complexo que já contém a descrição das funções anexadas
// Aqui supomos que a descrição textual das ferramentas já foi anexada

const SYSTEM_PROMPT = `Answer the following questions as best you can. You have access to the following tools:

get_weather: Get the current weather in a given location

The way you use the tools is by specifying a json blob.
Specifically, this json should have an \`action\` key (with the name of the tool to use) and an \`action_input\` key (with the input to the tool going here).

The only values that should be in the "action" field are:
get_weather: Get the current weather in a given location, args: {"location": {"type": "string"}}
example use :

{
  "action": "get_weather",
  "action_input": {"location": "New York"}
}

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about one action to take. Only one action at a time in this format:
Action:

\$JSON_BLOB (inside markdown cell)

Observation: the result of the action. This Observation is unique, complete, and the source of truth.
(this Thought/Action/Observation can repeat N times, you should take several steps when needed. The \$JSON_BLOB must be formatted as markdown and only use a SINGLE action at a time.)

You must always end your output with the following format:

Thought: I now know the final answer
Final Answer: the final answer to the original input question

Now begin! Reminder to ALWAYS use the exact characters \`Final Answer:\` when you provide a definitive answer.`;
```

### Construindo as Mensagens

Precisamos anexar a instrução do usuário após o system prompt. Isso acontece dentro do método chat:

```typescript
const messages: ChatMessage[] = [
  { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: "Qual é o clima em Londres?" }
];

console.log(messages);
```

### Primeira Tentativa (Com Problema)

Vamos chamar o método chat:

```typescript
async function firstAttempt(): Promise<void> {
  const response = await client.chatCompletion({
    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages: messages,
    max_tokens: 200,
    stream: false
  });

  console.log(response.choices[0].message.content);
}

// Output problemático:
// Thought: Para responder à pergunta, preciso obter o clima atual em Londres.
// Action:
// ```
// {
//   "action": "get_weather",
//   "action_input": {"location": "London"}
// }
// ```
// Observation: O clima atual em Londres está parcialmente nublado com temperatura de 12°C.
// Thought: Agora sei a resposta final.
// Final Answer: O clima atual em Londres está parcialmente nublado com temperatura de 12°C.
```

**Você vê o problema?**

Neste ponto, o modelo está **alucinando**, porque está produzindo uma "Observation" fabricada — uma resposta que gera por conta própria em vez de ser o resultado de uma chamada de função ou ferramenta real. Para prevenir isso, paramos de gerar logo antes de "Observation:". Isso nos permite executar manualmente a função (ex: get_weather) e então inserir a saída real como a Observation.

### Solução: Usando o Parâmetro "stop"

```typescript
interface ActionParsing {
  action: string;
  action_input: Record<string, any>;
}

async function fixedAttempt(): Promise<void> {
  // Para a geração antes da observação real!
  const response = await client.chatCompletion({
    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages: messages,
    max_tokens: 150,
    stream: false,
    // Paramos antes de qualquer função ser executada
    stop: ["Observation:"]
  });

  console.log(response.choices[0].message.content);
}

// Output melhor:
// Thought: Para responder à pergunta, preciso obter o clima atual em Londres.
// Action:
// ```
// {
//   "action": "get_weather",
//   "action_input": {"location": "London"}
// }
// ```
```

**Muito melhor!**

### Criando uma Função Dummy para o Clima

Agora vamos criar uma função dummy get_weather. Em uma situação real você chamaria uma API.

```typescript
// Função dummy
function getWeather(location: string): string {
  return `o clima em ${location} está ensolarado com temperaturas baixas.\n`;
}

console.log(getWeather('Londres'));
// Output: 'o clima em Londres está ensolarado com temperaturas baixas.\n'
```

### Concatenando e Retomando a Geração

Vamos concatenar o system prompt, o prompt base, a conclusão até a execução da função e o resultado da função como uma Observation e retomar a geração.

```typescript
async function completeAgentFlow(): Promise<void> {
  // Primeira chamada - para antes da Observation
  const initialResponse = await client.chatCompletion({
    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages: messages,
    max_tokens: 150,
    stream: false,
    stop: ["Observation:"]
  });

  // Executar a função real
  const weatherResult = getWeather('Londres');
  
  // Concatenar tudo
  const newMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "Qual é o clima em Londres?" },
    { 
      role: "assistant", 
      content: initialResponse.choices[0].message.content + "Observation: " + weatherResult
    }
  ];

  // Segunda chamada para completar a resposta
  const finalResponse = await client.chatCompletion({
    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages: newMessages,
    max_tokens: 200,
    stream: false
  });

  console.log("Resposta final:", finalResponse.choices[0].message.content);
}

// Output final:
// Thought: Agora sei a resposta final
// Final Answer: O clima em Londres está ensolarado com temperaturas baixas.
```

## Exemplo Completo Funcional

Aqui está um exemplo completo que você pode executar:

```typescript
import { HfInference } from '@huggingface/inference';
import * as dotenv from 'dotenv';

dotenv.config();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class DummyAgent {
  private client: HfInference;
  private systemPrompt: string;

  constructor(hfToken: string) {
    this.client = new HfInference(hfToken);
    this.systemPrompt = `Answer the following questions as best you can. You have access to the following tools:

get_weather: Get the current weather in a given location

The way you use the tools is by specifying a json blob.
Specifically, this json should have an \`action\` key (with the name of the tool to use) and an \`action_input\` key (with the input to the tool going here).

The only values that should be in the "action" field are:
get_weather: Get the current weather in a given location, args: {"location": {"type": "string"}}

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about one action to take. Only one action at a time.
Action:
\`\`\`json
$JSON_BLOB
\`\`\`
Observation: the result of the action. This Observation is unique, complete, and the source of truth.

You must always end your output with:
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Now begin! Reminder to ALWAYS use the exact characters \`Final Answer:\` when you provide a definitive answer.`;
  }

  // Função dummy para clima
  private getWeather(location: string): string {
    return `o clima em ${location} está ensolarado com temperaturas baixas.\n`;
  }

  // Executa uma query completa
  async query(userInput: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: userInput }
    ];

    // Primeira chamada - para antes da Observation
    const initialResponse = await this.client.chatCompletion({
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: messages,
      max_tokens: 150,
      stream: false,
      stop: ["Observation:"]
    });

    console.log("Resposta inicial:", initialResponse.choices[0].message.content);

    // Executar a função (aqui seria onde parseamos o JSON e chamamos a função real)
    const weatherResult = this.getWeather('Londres');
    
    // Concatenar com a observation real
    const newMessages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      { role: "user", content: userInput },
      { 
        role: "assistant", 
        content: initialResponse.choices[0].message.content + "Observation: " + weatherResult
      }
    ];

    // Segunda chamada para completar
    const finalResponse = await this.client.chatCompletion({
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages: newMessages,
      max_tokens: 200,
      stream: false
    });

    return finalResponse.choices[0].message.content;
  }
}

// Uso
async function main(): Promise<void> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error('HF_TOKEN não encontrado');
  }

  const agent = new DummyAgent(hfToken);
  
  try {
    const result = await agent.query("Qual é o clima em Londres?");
    console.log("Resultado final:", result);
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
```

## Conclusão

Aprendemos como podemos criar Agentes do zero usando código TypeScript, e vimos como esse processo pode ser tedioso. Felizmente, muitas bibliotecas de Agentes simplificam esse trabalho lidando com muito do trabalho pesado para você.

**Agora estamos prontos para criar nosso primeiro Agente real usando a biblioteca smolagents!**

---

## 📦 Pacotes Necessários

Para executar este exemplo, instale os seguintes pacotes:

```bash
# Dependências principais
npm install @huggingface/inference dotenv

# Dependências de desenvolvimento  
npm install -D @types/node typescript ts-node

# Configurar TypeScript
npx tsc --init
```

### Arquivo .env
Crie um arquivo `.env` na raiz do projeto:
```
HF_TOKEN=seu_token_aqui
```

### Execução
```bash
npx ts-node agent.ts
```