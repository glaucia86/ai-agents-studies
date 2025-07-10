import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

type BookInfo = {
  author: string;
  year: number;
  summary: string;
  genre: string;
  pages: number;
};

type ToolCall = {
  toolName: string;
  args: any;
};

const token = process.env.OPEN_API_GITHUB_MODEL_TOKEN;
const endpoint = process.env.OPEN_API_GITHUB_MODEL_ENDPOINT || 'https://models.github.ai/inference';
const modelName = 'openai/gpt-4o';

if (!token) {
  throw new Error("❌ Token não encontrado! Configure OPEN_API_GITHUB_MODEL_TOKEN no arquivo .env");
}

// Chamada da API OpenAI
const client = new OpenAI({
  baseURL: endpoint,
  apiKey: token,
});

// Simular uma API de livros
const booksDatabase: Record<string, BookInfo> = {
  "Dom Casmurro": {
    author: "Machado de Assis",
    year: 1899,
    summary: "Romance que narra a história de Bentinho e sua obsessão com a suposta traição de Capitu",
    genre: "Romance/Realismo",
    pages: 256
  },
  "O Cortiço": {
    author: "Aluísio Azevedo",
    year: 1890,
    summary: "Romance naturalista que retrata a vida em um cortiço no Rio de Janeiro do século XIX",
    genre: "Naturalismo",
    pages: 304,
  },
  "1984": {
    author: "George Orwell",
    year: 1949,
    summary: "Distopia que retrata uma sociedade totalitária sob constante vigilância do 'Big Brother'",
    genre: "Ficção Científica/Distopia",
    pages: 328,
  },
  "Pride and Prejudice": {
    author: "Jane Austen",
    year: 1813,
    summary: "Romance e crítica a sociedade inglesa através da história de Elizabeth Bennet e Mr. Darcy.",
    genre: "Romance/Drama",
    pages: 432,
  },
  "O Pequeno Príncipe": {
    author: "Antonie de Saint-Exupéry",
    year: 1943,
    summary: "Fábula poética sobre um príncipe que viaja entre planetas e aprende sobre a vida e amor.",
    genre: "Fábula/Infantil",
    pages: 96
  }
};

// Tool Function:  Buscar as informações de livros:
function bookLookupTool(args: { title: string}): string {
  console.log(`🔍 Buscando informações sobre...: ${args.title}`);

  // Busca exata
  let book = booksDatabase[args.title];

  // Se não encontrar, tenta busca case-sensitive
  if (!book) {
    const foundKey = Object
    .keys(booksDatabase)
    .find(key => key.toLowerCase() === args.title.toLowerCase());

    if (foundKey) {
      book = booksDatabase[foundKey];
    }
  }

  //  Se ainda não encontrar, tenta buscas parcial
  if (!book) {
    const foundkey = Object
      .keys(booksDatabase)
      .find(key => key.toLowerCase().includes(args.title.toLowerCase()) ||
            args.title.toLowerCase().includes(key.toLowerCase()));

    if (foundkey) {
      book = booksDatabase[foundkey];
      console.log(` ✨ Encontrado por busca aproximada...: ${foundkey}`);
    }
  }

  if (!book) {
    return `❌ Livro "${args.title}" não encontrado na nossa base de dados.
    📚 Livros disponíveis...: ${Object.keys(booksDatabase).join(', ')}`
  }

  return `📖 **${args.title}**
  👤 **Autor:** ${book.author}
  📅 **Ano:** ${book.year}
  🎭 **Gênero:** ${book.genre}
  📄 **Páginas:** ${book.pages}
  📝 **Resumo:** ${book.summary}`;
}

// Parser: Detectar chamadas de ferramentas no texto de LLM
function parseToolCall(content: string): ToolCall | null {
  // Procura por: book_lookup(title="Nome do Livro")
  const toolCallRegex = /book_lookup\s*\(\s*title\s*=\s*["']([^"']+)["']\s*\)/i;
  const match = content.match(toolCallRegex);

  if (!match) return null;

  return {
    toolName: 'book_lookup',
    args: { title: match[1] }
  };
}

// Executar a ferramenta/Tool
function executeTool(toolCall: ToolCall): string {
  if (toolCall.toolName === 'book_lookup') {
    return bookLookupTool(toolCall.args);
  }

  return `❌ Ferramenta "${toolCall.toolName}" não encontrado`;
}

// Chamar o LLM usando a biblioteca oficial da OpenAI
async function callLLM(messages: Message[]): Promise<string> {
  try {
    console.log(`  🧠 Enviando ${messages.length} mensagens para o LLM...`);
    
    const responseLLM = await client.chat.completions.create({
      messages: messages,
      temperature: 0.3,
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

    return content.trim();
  } catch (error) {
    console.error("❌ Erro ao chamar LLM:", error);
    throw new Error(`Erro interno: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function createSystemPrompt(): string {
  const availableBooks = Object.keys(booksDatabase).join(', ');

  return `Você é um assistente especializado em livros e literatura.

        🔧 FERRAMENTA DISPONÍVEL:
        - book_lookup: Busca informações detalhadas sobre um livro pelo título

        📚 LIVROS NA BASE DE DADOS:
        ${availableBooks}

        🎯 INSTRUÇÕES PARA O CICLO THOUGHT-ACTION-OBSERVATION:

        1. **THOUGHT**: Analise a pergunta do usuário sobre livros
        - Se for sobre um livro específico → use a ferramenta
        - Se for pergunta geral → responda diretamente

        2. **ACTION**: Para buscar um livro, responda EXATAMENTE assim:
        book_lookup(title="Nome Exato do Livro")

        3. **OBSERVATION**: Após receber os dados, formule uma resposta completa

        💡 EXEMPLOS:
        - "Me fale sobre Dom Casmurro" → book_lookup(title="Dom Casmurro")
        - "Quem escreveu 1984?" → book_lookup(title="1984")
        - "O que você sabe sobre Jane Austen?" → book_lookup(title="Pride and Prejudice")

        Se o usuário perguntar sobre livros que não estão na base, informe quais livros estão disponíveis.

        Seja sempre educativo e entusiasmado sobre literatura!`;
}

//🔄 Loop principal: Implementa o ciclo Thought-Action-Observation
async function runBookAgent(userQuestion: string, maxIterations: number = 3): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: createSystemPrompt() },
    { role: 'user', content: userQuestion }
  ];

  console.log(`\n📚 BOOK AGENT - Ciclo Thought-Action-Observation`);
  console.log(`❓ Pergunta: "${userQuestion}"`);
  console.log('=' .repeat(60));

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    console.log(`\n🔄 ITERAÇÃO ${iteration}:`);

    try {
      // 💭 THOUGHT: LLM analisa a situação
      console.log('💭 THOUGHT: Analisando a pergunta sobre livros...');
      const response = await callLLM(messages);

      console.log(`💭 Resposta do LLM: "${response}"`)

      // Verifica se é uma chamada da ferramenta book_lookup
      const toolCall = parseToolCall(response);

      if (toolCall) {
        // 🔧 ACTION: Executa a busca de livro
        console.log(`🔧 ACTION: Executando ${toolCall.toolName}(title="${toolCall.args.title}")`);

        const toolResult = executeTool(toolCall);
        console.log(`📊 OBSERVATION: Dados encontrados!`);

        // Adiciona a interação ao histórico
        messages.push({ role: 'assistant', content: response });
        messages.push({ role: 'function', name: toolCall.toolName, content: toolResult });
      } else {
        // ✅ Resposta final
        console.log('✅ RESPOSTA FINAL: Agent concluiu a busca!');
        console.log('=' .repeat(60));

        return response;
      }
    } catch (error: unknown) {
      console.error(`❌ Erro na iteração ${iteration}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Erro durante o processamento: ${errorMessage}`;
    }
  }

  return "⏰ Limite de iterações atingido. Não foi possível completar a busca."
}

// 🧪 Função para testar o agent com diferentes perguntas
async function testBookAgent(): Promise<void> {
  console.log("🚀 TESTANDO BOOK AGENT\n");

  const testQuestions = [
    "Me fale sobre o livro Dom Casmurro",
    "Quem escreveu 1984 e do que se trata?",
    "O que você sabe sobre The Pride and Prejudice",
    "Me fale sobre Código Limpo", // Este não está na base
    "Quais livros você conhece?", // Pergunta geral
    "Compare Dom Casmurro com O Cortiço" // Pergunta que precisa de 2 tools
  ];

  for (const question of testQuestions) {
    try {
      const answer = await runBookAgent(question);
      console.log(`\n📖 RESPOSTA FINAL:\n${answer}\n`);
      console.log('='.repeat(80));
    } catch (error: unknown) {
      console.error(`❌ Erro ao processar "${question}":`, error)
    }
  }
}

// Modo interativo
async function interactiveMode(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
    📚 BOOK AGENT INTERATIVO
        Digite suas perguntas sobre livros!
        Comandos especiais:
        - "livros" = mostra livros disponíveis
        - "sair" = encerra o programa
  `);

  const askQuestion = () => {
    rl.question('\n📝 Sua pergunta sobre livros: ', async (input: string) => {
      if (input.toLowerCase() === 'sair') {
        console.log('👋 Obrigado por usar o Book Agent!');
        rl.close();
        return;
      }

      if (input.toLowerCase() === 'livros') {
        console.log('\n📚 Livros disponíveis:', Object.keys(booksDatabase).join(', '));
        askQuestion();
        return;
      }

      try {
        const answer = await runBookAgent(input);
        console.log(`\n🤖 Book Agent:\n${answer}`);
      } catch (error) {
        console.error('❌ Erro:', error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// 🏁 Função principal
async function main(): Promise<void> {
  console.log('🔍 Verificando configuração...');
  
  try {
    // Teste rápido do LLM
    const testResponse = await callLLM([
      { role: 'system', content: 'Você é um assistente.' },
      { role: 'user', content: 'Responda apenas: "Funcionando!"' }
    ]);
    console.log('✅ LLM conectado:', testResponse);
    
    // Inicia modo interativo
    await interactiveMode();
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    console.log('\n🔧 VERIFICAR:');
    console.log('1. Arquivo .env existe?');
    console.log('2. OPEN_API_GITHUB_MODEL_TOKEN está definido?');
    console.log('3. Token é válido?');
  }
}

// 💡 Exemplo de uso direto
async function exemploUso(): Promise<void> {
  try {
    console.log('📖 Exemplo de uso direto:\n');
    
    const resposta = await runBookAgent("Me fale sobre Dom Casmurro e compare com 1984");
    console.log('Resposta:', resposta);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

// 🚀 COMANDOS PARA EXECUTAR:
// npm run test    → Testa várias perguntas
// npm run start   → Modo interativo
// npm run example → Exemplo simples

// Descomente a linha desejada:
// testBookAgent();     // Para testes automáticos
 main();              // Para modo interativo
// exemploUso();        // Para exemplo simples

export { runBookAgent, bookLookupTool, callLLM, booksDatabase };