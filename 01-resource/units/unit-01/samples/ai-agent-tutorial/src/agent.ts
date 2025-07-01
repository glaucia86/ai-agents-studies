import OpenAI from "openai";
import { calculatorTool, executeCalculator } from "./tools";
import * as dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.OPEN_API_GITHUB_MODEL_TOKEN
});


export class AIAgent {
  
  async chat(userMessage: string): Promise<string> {
    console.log(`\n👤 Você: ${userMessage}`);
    
    // 1. Preparar conversa
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system", 
        content: "Você é um assistente matemático. Use a calculadora para fazer cálculos."
      },
      {
        role: "user", 
        content: userMessage
      }
    ];
    
    // 2. Chamar o AI com as tools disponíveis
    const response = await client.chat.completions.create({
      model: "openai/gpt-4o",
      messages,
      tools: [calculatorTool],  // ← Aqui está o Function Calling!
      tool_choice: "auto"       // ← AI decide quando usar tools
    });
    
    const message = response.choices[0].message;
    
    // 3. Verificar se AI quer usar alguma tool
    if (message.tool_calls) {
      console.log("🔧 AI quer usar ferramentas!");
      
      // Adicionar resposta do AI
      messages.push({
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls
      });
      
      // 4. Executar cada tool que o AI pediu
      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === "calculator") {
          try {
            // Pegar argumentos que o AI enviou
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`📥 AI enviou...:`, args);
            
            // Executar nossa calculadora
            const result = await executeCalculator(args);
            console.log(`📤 Resultado...:`, result);
            
            // Enviar resultado de volta para o AI
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
            
          } catch (error) {
            console.log(`❌ Erro...:`, error);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Erro no cálculo" })
            });
          }
        }
      }
      
      // 5. Pedir resposta final do AI
      const finalResponse = await client.chat.completions.create({
        model: "openai/gpt-4o",
        messages
      });
      
      return finalResponse.choices[0].message.content || "Sem resposta";
    }
    
    // Se não usou tools, retornar resposta direta
    return message.content || "Sem resposta";
  }
}