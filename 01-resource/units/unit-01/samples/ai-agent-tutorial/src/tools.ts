import { CalculatorInputSchema, CalculatorInputType, CalculatorOutputSchema, CalculatorOutputType, zodToOpenAI } from "./schemas";

export async function executeCalculator(input: CalculatorInputType): Promise<CalculatorOutputType> {
  console.log(`🔢 Calculando...: ${input.a} ${input.operation} ${input.b}`);

  const validated = CalculatorInputSchema.parse(input);

  let result: number;

  switch (validated.operation) {
    case "add":
      result = validated.a + validated.b;
      break;
    case "subtract":
      result = validated.a - validated.b;
      break;
    case "multiply":
      result = validated.a * validated.b;
      break;
    case "divide":
      if (validated.b === 0) {
        throw new Error("Division by zero is not allowed");
      }
      result = validated.a / validated.b;
      break;
  }

  return CalculatorOutputSchema.parse({
    result,
    explanation: `${validated.a} ${validated.operation} ${validated.b} = ${result}`,
  });
}

export const calculatorTool = {
  type: "function" as const,
  function: {
    name: "calculator",
    description: "Calcula operações matemáticas básicas como adição, subtração, multiplicação e divisão.",
    parameters: zodToOpenAI(CalculatorInputSchema),
  }
};