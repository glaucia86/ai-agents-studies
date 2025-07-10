# **O Ciclo “Thought-Action-Observation” em AI Agents**

**AI Agents** não são apenas “LLMs que respondem”, mas sistemas que **pensam, agem e observam** o ambiente, repetindo esse ciclo até que o objetivo seja cumprido. O nome desse ciclo é: **Thought (Pensar) → Action (Agir) → Observation (Observar)**. Esse processo lembra um loop de programação, onde cada volta da repetição é uma iteração:

> **while (!objetivoAlcancado) { pensar(); agir(); observar(); }**

Imagine, para visualizar, que tudo começa com uma instrução clara no *system prompt*. O agente recebe orientações explícitas de como agir passo a passo, tendo acesso a ferramentas, sabendo descrever seu raciocínio (Thought), quando executar uma ação (Action) e como incluir no contexto tudo o que observar (Observation), até retornar uma resposta final clara. Um terminal de exemplo mostraria a configuração desse prompt, indicando as tools disponíveis (como uma calculadora) e instruções para sempre responder de forma estruturada, conforme o ciclo.

O ciclo se inicia de fato quando o usuário envia uma pergunta, como “Qual o clima em Nova York?”. Visualize o mascote da Hugging Face (um emoji sorridente amarelo) ao lado de um smartphone, fazendo essa pergunta em uma caixa de diálogo. Esse é o **ponto de partida** do fluxo: a mensagem do usuário.

Em seguida, o agente pensa. Nessa etapa, imagine o mascote dentro do celular, com uma expressão reflexiva e uma nuvem de pensamento acima de sua cabeça. Dentro dessa nuvem, o agente analisa o pedido do usuário e decide: “Preciso de informações atualizadas sobre o clima em Nova York. Tenho uma ferramenta que faz isso. Primeiro, vou chamar a API de clima para buscar esses dados.” Essa é a etapa **Thought**, onde o agente planeja o próximo passo.

O próximo estágio é a ação. Aqui, visualize o agente preparando um comando, escrevendo algo como:

```json
{ "action": "get_weather", "action_input": { "location": "New York" } }
```

Esse comando é enviado a uma ferramenta externa (por exemplo, uma API do tempo), simbolizada por um cartão colorido com um ícone de nuvem e sol. O agente está, de fato, **executando a ação** para buscar a resposta real.

Quando a ação retorna, o agente entra na fase de observação. Pense nele recebendo o resultado da API, como “Parcialmente nublado, 15°C, 60% de umidade”. O agente anota essa observação no seu contexto, pronto para refletir novamente. Visualmente, ele aparece em uma nova nuvem de pensamento, processando a resposta recebida.

Com a observação em mãos, o agente pensa mais uma vez sobre como apresentar a resposta de forma clara e útil para o usuário. Por fim, ele retorna a resposta, dizendo algo como: “O tempo agora em Nova York está parcialmente nublado, com temperatura de 15°C e umidade de 60%.” Essa etapa conclui um ciclo completo de Thought-Action-Observation, exatamente como ilustrado nas imagens: do prompt à resposta final.

---

Esse ciclo, ao ser repetido, permite que o agente seja autônomo, tome decisões com base no ambiente e corrija seu caminho se necessário. Cada passo — do raciocínio à execução e à observação — é registrado, tornando o agente não apenas útil e confiável, mas também transparente e auditável.

---

## **Como implementar esse ciclo em código?**

Frameworks como LangChain e Semantic Kernel automatizam esse ciclo, mas você pode implementar o seu próprio, controlando explicitamente cada etapa. Um pseudocódigo para ilustrar:

```typescript
while (!objectiveFulfilled) {
  // 1. Thought: LLM decide a próxima ação
  const agentThought = LLM({
    context: previousMessages,
    systemPrompt: agentInstructions
  });

  // 2. Action: LLM sugere uma tool e argumentos
  if (isToolCall(agentThought)) {
    const { tool, args } = parseToolCall(agentThought);
    const observation = await runTool(tool, args);

    // 3. Observation: Adiciona a observação ao contexto
    previousMessages.push({ role: "function", content: `Observation: ${observation}` });
  } else {
    // Resposta final ao usuário
    break;
  }
}
```

Você pode controlar quantos ciclos de pensamento/ação/observação permite, e sempre incluir feedback real como “Observation” para o modelo.
