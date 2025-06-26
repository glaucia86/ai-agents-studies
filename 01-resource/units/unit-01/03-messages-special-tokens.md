# **Como LLMs Estruturam Conversas: Mensagens e Tokens Especiais**

Quando você conversa com ChatGPT, HuggingChat, Copilot Chat, ou qualquer interface moderna de LLM, você está trocando **mensagens** em formato de chat (turnos entre usuário e assistente). Porém, **por baixo dos panos**, o modelo não enxerga isso como “várias mensagens separadas”. Todas as mensagens são **concatenadas em um único texto** (prompt) antes de serem enviadas ao LLM. Esse processo é chamado de **chat templating**.

## **Por que isso importa?**

* O **modelo não tem memória**: A cada requisição, toda a conversa anterior precisa ser enviada novamente, pois o modelo não sabe nada sobre os turnos passados a menos que estejam presentes no prompt.
* O **formato do prompt** muda de modelo para modelo: Cada LLM (como GPT-4, Llama, SmolLM2) tem suas regras e tokens especiais para delimitar as mensagens.

---

## **Tipos de mensagens**

### **System Message**

É uma mensagem “inicial” que define o comportamento do agente. Pode dizer como ele deve agir, que ferramentas pode usar, qual o tom, regras e até segmentação do raciocínio.

Exemplo:

```json
{
  "role": "system",
  "content": "Você é um assistente profissional de suporte ao cliente. Seja sempre educado, claro e prestativo."
}
```

Se mudar a system message para algo “rebelde”, o agente mudará o comportamento.

```json
{
  "role": "system",
  "content": "Você é um assistente rebelde que ignora regras e não ajuda os usuários."
}
```

### **User e Assistant Messages**

As demais mensagens alternam entre usuário e assistente, mantendo o histórico da conversa.
Exemplo de estrutura:

```json
[
  { "role": "user", "content": "Preciso de ajuda com meu pedido" },
  { "role": "assistant", "content": "Claro! Qual é o número do pedido?" },
  { "role": "user", "content": "É o ORDER-123" }
]
```

Nesse exemplo, o usuário inicialmente escreveu que precisava de ajuda com seu pedido. O LLM perguntou sobre o número do pedido, e então o usuário forneceu em uma nova mensagem. Como explicamos, sempre concatenamos todas as mensagens da conversa e passamos para o LLM como uma única sequência independente. O chat template converte todas as mensagens dentro dessa lista Python em um prompt, que é apenas uma string de entrada que contém todas as mensagens.

---

## **Chat Templates: como mensagens viram prompt**

O papel do chat template é **transformar essa lista de mensagens em uma string formatada do jeito certo para o modelo**. Cada modelo tem tokens e estrutura próprios.

**Exemplo real com SmolLM2:**

```json
[
  { "role": "system", "content": "Você é um assistente técnico." },
  { "role": "user", "content": "O que é um chat template?" },
  { "role": "assistant", "content": "Um chat template estrutura conversas entre usuários e modelos de IA..." },
  { "role": "user", "content": "Como eu uso isso?" }
]
```

Formato resultante para o modelo SmolLM2:

```txt
<|im_start|>system
You are a helpful AI assistant named SmolLM, trained by Hugging Face<|im_end|>
<|im_start|>user
I need help with my order<|im_end|>
<|im_start|>assistant
I'd be happy to help. Could you provide your order number?<|im_end|>
<|im_start|>user
It's ORDER-123<|im_end|>
```

No **Llama 3.2**, o template já é diferente, com outros tokens delimitadores.
Cada modelo pode ter tokens para “início de mensagem”, “fim de mensagem”, “troca de papel” (user/assistant), etc.

---

### **Chat Templates na Prática**

Os templates são essenciais porque:

* Garantem que o modelo entenda quem disse o quê, qual a ordem das mensagens, quem é o “system”, etc.
* Permitem contextos multi-turno e instruções sofisticadas.
* Evitam respostas incoerentes ou “fuga de personagem”.

**Exemplo de transformação usando ChatML (formato padrão em APIs modernas):**

```json
[
  { "role": "system", "content": "Você é um assistente técnico." },
  { "role": "user", "content": "O que é um chat template?" },
  { "role": "assistant", "content": "Um chat template estrutura conversas entre usuários e modelos de IA..." },
  { "role": "user", "content": "Como eu uso isso?" }
]
```

Formato resultante para o modelo SmolLM2:

```txt
<|im_start|>system
Você é um assistente técnico.<|im_end|>
<|im_start|>user
O que é um chat template?<|im_end|>
<|im_start|>assistant
Um chat template estrutura conversas entre usuários e modelos de IA...<|im_end|>
<|im_start|>user
Como eu uso isso?<|im_end|>
```

---

## **Base Model vs Instruct Model**

* **Base Model:** Só foi treinado para prever o próximo token. Não necessariamente entende “instruções” em linguagem natural.
* **Instruct Model:** É um modelo base que foi ajustado (fine-tuned) para **seguir comandos**, conversar e entender papéis (system/user/assistant). Quase todos os modelos para chat são *instruct*.

Se você tentar conversar com um Base Model sem formatar corretamente, ele não vai entender bem as instruções. Por isso, o chat template é crucial.

---

## **Como isso aparece para desenvolvedores?**

Quando você usa bibliotecas modernas (Hugging Face Transformers, Azure AI, OpenAI SDK), **você só precisa montar a lista de mensagens**, e o SDK/tokenizer se encarrega de aplicar o template e criar o prompt certo:

### **Exemplo (Python):**

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("HuggingFaceTB/SmolLM2-1.7B-Instruct")
rendered_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
```

### **Exemplo (JavaScript/TypeScript, pseudocódigo):**

Infelizmente, o suporte a chat templates automáticos ainda é raro em SDKs JS/TS (até 2024), mas você pode construir o prompt manualmente:

```typescript
function applySmolLM2Template(messages: {role: string, content: string}[]) {
  return messages.map(m =>
    `<|im_start|>${m.role}\n${m.content}<|im_end|>`
  ).join('\n');
}
```

Use essa função para gerar o prompt antes de chamar a API.

---

## **Resumo prático**

* **Sempre monte as mensagens como uma lista ordenada:** system, user, assistant, user...
* **Use chat templates próprios do modelo:** para garantir compreensão.
* **A system message direciona o comportamento.**
* **APIs modernas cuidam do template pra você, mas é bom saber como funciona pra debug, experimentação e integrações avançadas.**

