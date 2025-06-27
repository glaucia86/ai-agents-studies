## **O que são Tools em AI Agents?**

**Tools** (ferramentas) são funções ou APIs externas que ampliam a capacidade do agente de IA além do que o modelo LLM consegue fazer só com texto.
Exemplos de ferramentas:

* Busca web (web search)
* Geração de imagens
* Consulta a bancos de dados
* Integração com APIs (GitHub, YouTube, etc)
* Calculadora, tradutor, leitura de arquivos, etc

**Por que são essenciais?**
LLMs são limitados ao conhecimento aprendido no treinamento e só geram texto. Se você pedir “qual a cotação do dólar hoje?” ou “crie uma imagem de um cachorro voando”, o modelo pode inventar ou simplesmente não conseguir. Mas, se ele souber acionar uma *tool* de busca ou de geração de imagens, o agente realmente “ganha superpoderes”.

---

## **Como funciona na prática**

1. **Você descreve a tool para o LLM** no system prompt, explicando o que ela faz, entradas e saídas.
2. **O modelo aprende** (via system prompt) que pode usar essa tool, gerando comandos textuais como:
   `call weather_tool('Paris')` ou `calculator(a=2, b=3)`
3. **Seu código interpreta** esse comando, executa a função real (ex: busca web, calculadora) e devolve o resultado para o LLM gerar a resposta final ao usuário.

---

## **Como descrever uma Tool para o agente**

A descrição da ferramenta deve incluir:

* Nome
* O que faz
* Argumentos (nomes e tipos)
* Saída (tipo)
* (Opcional) Exemplo de uso

**Exemplo para uma calculadora simples:**

```txt
Tool Name: calculator, Description: Multiply two integers., Arguments: a: int, b: int, Outputs: int
```

---

## **Como implementar Tools em TypeScript**

Você pode criar um padrão similar ao exemplo em Python usando classes e tipagem do TypeScript. Veja:

### **1. Classe Tool genérica**

```typescript
type ArgumentDef = { name: string, type: string };

class Tool {
  name: string;
  description: string;
  func: (...args: any[]) => any;
  arguments: ArgumentDef[];
  outputs: string;

  constructor(
    name: string,
    description: string,
    func: (...args: any[]) => any,
    args: ArgumentDef[],
    outputs: string
  ) {
    this.name = name;
    this.description = description;
    this.func = func;
    this.arguments = args;
    this.outputs = outputs;
  }

  toString(): string {
    const argsStr = this.arguments.map(arg => `${arg.name}: ${arg.type}`).join(', ');
    return `Tool Name: ${this.name}, Description: ${this.description}, Arguments: ${argsStr}, Outputs: ${this.outputs}`;
  }

  call(...args: any[]): any {
    return this.func(...args);
  }
}
```

### **2. Exemplo de Tool concreta (calculadora)**

```typescript
function calculator(a: number, b: number): number {
  /** Multiply two integers. */
  return a * b;
}

const calculatorTool = new Tool(
  "calculator",
  "Multiply two integers.",
  calculator,
  [
    { name: "a", type: "int" },
    { name: "b", type: "int" }
  ],
  "int"
);

console.log(calculatorTool.toString());
// Tool Name: calculator, Description: Multiply two integers., Arguments: a: int, b: int, Outputs: int

// Exemplo de chamada real:
console.log("Resultado:", calculatorTool.call(4, 5)); // Resultado: 20
```

---

### **3. Como incluir a descrição da Tool no System Prompt**

Quando for criar o system prompt para o LLM, inclua a descrição das ferramentas disponíveis, por exemplo:

```typescript
const toolsDescriptions = [calculatorTool].map(tool => tool.toString()).join('\n');

// Exemplo de System Message:
const systemPrompt = `
You are an AI agent with access to tools.
Available tools:
${toolsDescriptions}

Always use the correct tool for calculations.
`;
```

---

### **4. Como um agente usa a tool (visão geral do fluxo)**

* O usuário pede: “Qual o resultado de 3 x 7?”
* O LLM responde algo como:
  `calculator(a=3, b=7)`
* Seu código interpreta a resposta, identifica que é um comando para uma tool, executa a função real (`calculatorTool.call(3, 7)`), pega o resultado e repassa para o LLM construir a resposta final, que será algo como: “O resultado de 3 x 7 é 21.”

Esse processo é base de *RAG*, copilots, assistentes inteligentes e de qualquer agente AI com “ferramentas”.

---

## **Resumo**

* **Tools são funções externas** que ampliam a capacidade dos agentes.
* **Descreva suas tools de forma clara e estruturada** no prompt do LLM.
* **Implemente um padrão de classe/factory** para facilitar adição e descrição automática das ferramentas.
* O agente nunca chama uma função de verdade — ele apenas sugere *o que fazer*. Seu código executa.
* Isso prepara o terreno para agentes de verdade: que observam, pensam e agem.
