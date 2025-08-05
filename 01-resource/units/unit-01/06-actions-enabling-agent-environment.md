# Actions: Permitindo que o Agente Interaja com seu Ambiente

Nesta seção, exploraremos os passos concretos que um agente de IA executa para interagir com seu ambiente.
Abordaremos como as ações são representadas (usando JSON ou código), a importância da abordagem "stop and parse" (parar e analisar), e introduziremos diferentes tipos de agentes.

**Actions são os passos concretos que um agente de IA executa para interagir com seu ambiente.**

Seja navegando na web por informações ou controlando um dispositivo físico, cada ação é uma operação deliberada executada pelo agente.

Por exemplo, um agente que auxilia no atendimento ao cliente pode recuperar dados do cliente, oferecer artigos de suporte ou transferir questões para um representante humano.

## Tipos de Actions de Agentes

Existem múltiplos tipos de Agentes que executam ações de forma diferente:

| Tipo de Agente | Descrição |
|----------------|-----------|
| **JSON Agent** | A Action a ser tomada é especificada em formato JSON. |
| **Code Agent** | O Agente escreve um bloco de código que é interpretado externamente. |
| **Function-calling Agent** | É uma subcategoria do JSON Agent que foi fine-tuned para gerar uma nova mensagem para cada ação. |

As próprias ações podem servir a muitos propósitos:

| Tipo de Action | Descrição |
|----------------|-----------|
| **Information Gathering** | Realizar buscas na web, consultar bancos de dados ou recuperar documentos. |
| **Tool Usage** | Fazer chamadas de API, executar cálculos e executar código. |
| **Environment Interaction** | Manipular interfaces digitais ou controlar dispositivos físicos. |
| **Communication** | Interagir com usuários via chat ou colaborar com outros agentes. |

O LLM apenas manipula texto e o usa para descrever a ação que deseja executar e os parâmetros a fornecer para a ferramenta. Para que um agente funcione adequadamente, o LLM deve **PARAR** de gerar novos tokens após emitir todos os tokens para definir uma Action completa. Isso passa o controle do LLM de volta para o agente e garante que o resultado seja analisável - seja o formato pretendido JSON, código ou function-calling.

## A Abordagem Stop and Parse

Um método-chave para implementar ações é a abordagem **stop and parse**. Este método garante que a saída do agente seja estruturada e previsível:

### 1. Geração em Formato Estruturado
O agente produz sua ação pretendida em um formato claro e predeterminado (JSON ou código).

### 2. Interrupção da Geração Adicional
Uma vez que o texto definindo a ação foi emitido, o LLM para de gerar tokens adicionais. Isso previne saídas extras ou errôneas.

### 3. Análise da Saída
Um analisador externo lê a ação formatada, determina qual Ferramenta chamar e extrai os parâmetros necessários.

Por exemplo, um agente que precisa verificar o clima pode produzir:

```
Thought: Preciso verificar o clima atual para Nova York.
Action:
{
  "action": "get_weather",
  "action_input": {"location": "Nova York"}
}
```

O framework pode então facilmente analisar o nome da função a chamar e os argumentos a aplicar.

Este formato claro e legível por máquina minimiza erros e permite que ferramentas externas processem com precisão o comando do agente.

**Nota:** Agentes function-calling operam de forma similar estruturando cada ação para que uma função designada seja invocada com os argumentos corretos. Vamos nos aprofundar nesses tipos de Agentes em uma Unidade futura.

## Code Agents

Uma abordagem alternativa é usar **Code Agents**. A ideia é: em vez de produzir um simples objeto JSON, um Code Agent gera um bloco de código executável—tipicamente em uma linguagem de alto nível como Python (ou no nosso caso, TypeScript).

Esta abordagem oferece várias vantagens:

- **Expressividade:** O código pode naturalmente representar lógica complexa, incluindo loops, condicionais e funções aninhadas, fornecendo maior flexibilidade que JSON.
- **Modularidade e Reutilização:** O código gerado pode incluir funções e módulos reutilizáveis entre diferentes ações ou tarefas.
- **Melhor Debuggabilidade:** Com uma sintaxe bem definida de programação, erros de código são frequentemente mais fáceis de detectar e corrigir.
- **Integração Direta:** Code Agents podem se integrar diretamente com bibliotecas e APIs externas, permitindo operações mais complexas como processamento de dados ou tomada de decisão em tempo real.

⚠️ **Atenção:** Você deve ter em mente que executar código gerado por LLM pode apresentar riscos de segurança, desde prompt injection até a execução de código malicioso. Por isso é recomendado usar frameworks de agentes de IA que integram salvaguardas padrão.

## Exemplo Prático em TypeScript

Aqui está um exemplo de como um Code Agent pode gerar código TypeScript para buscar informações do clima:

```typescript
// Code Agent Example: Recuperar Informações do Clima
interface WeatherResponse {
  weather?: string;
  temperature?: number;
  description?: string;
}

async function getWeather(city: string): Promise<string> {
  try {
    const apiUrl = `https://api.weather.com/v1/location/${city}?apiKey=YOUR_API_KEY`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data: WeatherResponse = await response.json();
      return data.weather || "Nenhuma informação meteorológica disponível";
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    return `Erro: Não foi possível buscar dados meteorológicos. ${error}`;
  }
}

// Executar a função e preparar a resposta final
async function executeWeatherCheck(): Promise<void> {
  const result = await getWeather("Nova York");
  const finalAnswer = `O clima atual em Nova York é: ${result}`;
  console.log(finalAnswer);
}

// Executar
executeWeatherCheck();
```

Neste exemplo, o Code Agent:

1. **Recupera** dados meteorológicos via chamada de API
2. **Processa** a resposta
3. **Usa** o `console.log()` para produzir uma resposta final

Este método também segue a abordagem stop and parse delimitando claramente o bloco de código e sinalizando quando a execução está completa (neste caso, imprimindo o `finalAnswer`).

## Conclusão

Aprendemos que **Actions** fazem a ponte entre o raciocínio interno de um agente e suas interações do mundo real executando tarefas claras e estruturadas—seja através de JSON, código ou chamadas de função.

Esta execução deliberada garante que cada ação seja precisa e pronta para processamento externo através da abordagem stop and parse. Na próxima seção, exploraremos **Observations** para ver como os agentes capturam e integram feedback de seu ambiente.

Depois disso, finalmente estaremos prontos para construir nosso primeiro Agente!