# **O que são LLMs?**

Os **Large Language Models (LLMs)** são modelos de Inteligência Artificial voltados para entender e gerar linguagem humana. Imagine um sistema que leu milhões de textos na internet, livros, artigos e aprendeu padrões, estruturas, contextos e até nuances da linguagem. É assim que LLMs, como GPT-4 (OpenAI), Llama 3 (Meta), Gemini (Google), entre outros, conseguem conversar, responder perguntas, escrever código e muito mais.

## **Arquitetura Transformer: o cérebro dos LLMs**

A maioria dos LLMs modernos é construída sobre a arquitetura **Transformer**, baseada em um mecanismo chamado “Atenção” (Attention). Essa arquitetura revolucionou o campo de NLP (Processamento de Linguagem Natural), pois permite que o modelo foque nas partes mais importantes de uma frase para entender seu significado e prever o próximo termo da sequência.

### **Tipos de Transformers**

* **Encoder:** Recebe um texto e gera uma representação densa dele (embedding). Ex: BERT. Usado para classificação, busca semântica, etc.
* **Decoder:** Gera novos tokens a partir de uma entrada, um de cada vez, completando frases. Ex: Llama. Usado para geração de texto, chatbots, geração de código.
* **Seq2Seq (Encoder-Decoder):** Primeiro codifica a entrada, depois gera uma saída baseada nesse contexto. Ex: T5, BART. Usado para tradução, sumarização, etc.

No mundo dos agents, os modelos mais usados são **decoder-based** (voltados para geração de texto).

---

## **Como um LLM funciona na prática?**

A lógica é simples, mas poderosa: **prever o próximo token** (um token pode ser parte de uma palavra, uma palavra ou um símbolo especial), dada uma sequência de tokens anterior. Por exemplo, o modelo recebe:
`"A capital da França é..."`
e tenta prever qual token faz mais sentido na sequência (provavelmente, “Paris”).

### **Tokenização**

Os LLMs trabalham com tokens em vez de palavras inteiras para serem mais eficientes e flexíveis. Por exemplo:

* “interesting” pode ser dividido em “interest” + “ing”
* “interested” pode ser “interest” + “ed”

Cada modelo tem tokens especiais, como os de início/fim de mensagem. Exemplos:

| Modelo  | Provedor | Token de Fim    |           |     |
| ------- | -------- | --------------- | --------- | --- |
| GPT-4   | OpenAI   | \`<             | endoftext | >\` |
| Llama 3 | Meta     | \`<             | eot\_id   | >\` |
| Gemma   | Google   | `<end_of_turn>` |           |     |

Você não precisa decorar esses tokens, mas saber que existem é importante, principalmente ao criar prompts ou interpretar respostas de diferentes modelos.

---

## **Decodificação e Previsão de Tokens**

Os LLMs são **autoregressivos**: ou seja, o output de uma etapa vira input para a próxima. O modelo segue prevendo tokens até encontrar o token de finalização (EOS).

### **Estratégias de Decodificação**

* **Mais simples:** Escolher sempre o token com maior probabilidade.
* **Mais avançada:** Beam Search, que avalia múltiplas sequências possíveis para encontrar a mais provável como um todo, e não só token a token.

---

## **Por que o “Prompt” é tão importante?**

Como a única função do LLM é prever o próximo token baseado no contexto, **a maneira como você escreve o prompt é fundamental** para guiar o modelo e obter a resposta desejada. Pequenas mudanças no prompt podem mudar totalmente o resultado.

---

## **Treinamento dos LLMs**

LLMs são treinados em grandes volumes de texto, aprendendo de forma não supervisionada (prever o próximo token em frases reais). Após o pré-treinamento, podem ser refinados (“fine-tuned”) para tarefas específicas, como conversação, classificação, uso de ferramentas ou geração de código.

---

## **Como usar LLMs na prática?**

Você pode rodar localmente (caso tenha hardware suficiente) ou via API em nuvem (como a Hugging Face Hub ou OpenAI). No curso da Hugging Face, o foco é usar modelos via API para facilitar o acesso.

### **Exemplo simples em JavaScript usando API da Hugging Face:**

```ts
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
// Esperado: "A capital da França é Paris."
```

> **Observação:** Para rodar esse exemplo, basta obter um token gratuito em [GitHub Models](https://github.com/marketplace/models/).

---

## **LLMs como o cérebro dos Agents**

No contexto de agentes, o **LLM é o cérebro**:

* **Interpreta comandos do usuário**
* **Mantém o contexto de conversas**
* **Planeja ações**
* **Decide quais ferramentas usar para agir sobre o ambiente**

Ou seja, o agent só consegue ser “inteligente” porque o LLM entende e responde ao mundo como um ser humano faria – mas em escala e velocidade de máquina.

---

**Resumo final:**

Os LLMs são modelos gigantes de linguagem, baseados na arquitetura Transformer, que aprendem padrões a partir de textos massivos. Eles funcionam prevendo tokens, são treinados em várias etapas, aceitam prompts cuidadosamente elaborados e formam o cérebro dos agentes de IA modernos.

