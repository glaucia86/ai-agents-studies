import { AIAgent } from "./agent";

async function testarAgent() {
  console.log("=== 🚀 Testando A.I Agent com Function Calling ===");

  const agent = new AIAgent();

  // Teste 1: Cálculo Simples
  console.log("=== Teste 1: Multiplicação ===");
  const resposta_1 = await agent.chat("Quanto é 15 vezes 23?");
  console.log(`🤖 A.I...: ${resposta_1}`);

  // Teste 2: Problema mais complexo
  console.log("=== Teste 2: Problema Complexo ===");
  const resposta_2 = await agent.chat("Se eu comprar 4 itens por R$ 12,50 cada, quanto eu gasto no total?");
  console.log(`🤖 A.I...: ${resposta_2}`);

  // Teste 3: Erro de Cálculo (divisão por zero)
  console.log("=== Teste 3: Erro de Cálculo ===");
  const resposta_3 = await agent.chat("Quanto é 10 dividido por 0?");
  console.log(`🤖 A.I...: ${resposta_3}`);

  console.log("=== ✅ Testes Concluídos ===");
}

if (require.main === module) {
  testarAgent().catch(console.error);
}

export { testarAgent };
