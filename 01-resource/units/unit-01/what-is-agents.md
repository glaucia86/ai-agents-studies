# O que são Agentes de IA?

## **O que é um Agent?**

Para entender o conceito de “Agent” (agente), o curso traz uma analogia bem didática: imagine o Alfred, um agente virtual. Se você pede ao Alfred “Quero um café”, ele entende o comando em linguagem natural, pensa sobre o que precisa fazer (ir até a cozinha, usar a cafeteira, preparar o café, trazer para você), decide a melhor ordem das ações, usa as ferramentas certas (no caso, a cafeteira), executa essas ações e entrega o café. Todo esse processo envolve **entender o pedido**, **raciocinar e planejar** e **interagir com o ambiente**.

É justamente isso que define um Agent em Inteligência Artificial: um sistema, geralmente equipado com um modelo de IA (normalmente um LLM), capaz de **raciocinar, planejar e interagir com o ambiente** para cumprir um objetivo definido pelo usuário. O termo “Agent” vem da palavra “agency”, que significa a capacidade de agir sobre o mundo ao redor.

### **Estrutura de um Agent**

Um agent tem basicamente dois componentes:

* **O “Cérebro” (AI Model):** é o modelo de IA (como um LLM) que faz o raciocínio e planejamento, decidindo as próximas ações baseadas no contexto.
* **O “Corpo” (Tools/Capacidades):** são as ações que o agent pode executar. A quantidade de “agência” do agent depende das ferramentas disponíveis. Por exemplo, um humano não pode “voar” porque não tem asas, mas pode “andar”, “pegar”, etc. Com um agent, você pode programar as ações possíveis de acordo com os recursos disponíveis.

### **Níveis de Agência**

Existem diferentes níveis de “agency”, do mais simples ao mais avançado. Um agent pode apenas processar uma resposta (por exemplo, apenas mostrar o output do LLM), ou pode decidir o caminho do fluxo de um programa, acionar funções específicas, ou até executar tarefas multi-etapas (como um workflow). Em casos mais avançados, um agent pode até disparar outros agents (multi-agentes).

Exemplo em **JavaScript**:

```js
// Nível simples: só processa a resposta do LLM
const response = await llm.generate(prompt);

// Nível de ferramenta: o LLM decide que função chamar
if (llmDecision === 'sendEmail') {
  sendEmail(args);
}

// Nível multi-step: enquanto o LLM disser para continuar, executa o próximo passo
while (llm.shouldContinue()) {
  executeNextStep();
}
```

### **Quais modelos de IA são usados?**

O mais comum é utilizar um **LLM** (Large Language Model), como GPT-4 (OpenAI), LLaMA (Meta), Gemini (Google), etc., que recebem texto como entrada e geram texto como saída. Existem também modelos multimodais, que recebem imagens, áudio, etc., mas o foco inicial é nos LLMs.

### **Como o agent “age” no ambiente?**

Por padrão, LLMs só geram texto, mas podem ser conectados a “tools” (ferramentas). Por exemplo, se você pedir para gerar uma imagem no ChatGPT, na verdade há uma integração entre o LLM e uma ferramenta de geração de imagens. O modelo, ao identificar o pedido, chama a tool adequada.

No código, isso pode parecer assim em **Python**:

```python
def send_message_to(recipient, message):
    """Envia um e-mail para o destinatário."""
    # Lógica de envio de e-mail
    pass

# O LLM gera esse comando para acionar a ferramenta
send_message_to("Manager", "Can we postpone today's meeting?")
```

**Equivalente em JavaScript:**

```js
function sendMessageTo(recipient, message) {
  // lógica para enviar o e-mail
}

// O agent (LLM) decide chamar essa função conforme a necessidade
sendMessageTo("Manager", "Can we postpone today's meeting?");
```

O design dessas tools é crucial. Ferramentas bem desenhadas permitem que o agent seja mais eficiente e versátil.

### **Exemplos práticos de Agents**

1. **Assistentes Virtuais (Siri, Alexa, Google Assistant):** Recebem comandos de voz, analisam o contexto, buscam informações, acionam outras ferramentas (enviar mensagem, marcar compromisso, etc.).
2. **Chatbots de Atendimento:** Respondem dúvidas, resolvem problemas, abrem chamados, fazem transações – tudo em linguagem natural e, muitas vezes, aprendendo com as interações.
3. **NPCs em Jogos:** NPCs podem se adaptar ao contexto do jogo, dialogar de forma dinâmica, tomar decisões estratégicas baseadas no comportamento do jogador.

### **Resumindo**

Um Agent é um sistema equipado com um modelo de IA (normalmente um LLM) que:

* Compreende linguagem natural e comandos humanos.
* Raciocina e planeja ações.
* Interage com o ambiente usando ferramentas programadas.

Isso permite desde assistentes pessoais, bots inteligentes e personagens em jogos até aplicações corporativas automatizadas.


