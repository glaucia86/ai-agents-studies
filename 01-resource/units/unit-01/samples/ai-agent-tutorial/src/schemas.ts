import { z } from "zod";

export const CalculatorInputSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

export const CalculatorOutputSchema = z.object({
  result: z.number(),
  explanation: z.string()
});

export type CalculatorInputType = z.infer<typeof CalculatorInputSchema>;
export type CalculatorOutputType = z.infer<typeof CalculatorOutputSchema>;

export function zodToOpenAI(schema: z.ZodObject<any>) {
  const shape = schema.shape;
  const properties: any = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    if (value instanceof z.ZodOptional) {
      properties[key] = { type: 'number' };
    } else if (value instanceof z.ZodEnum) {
      properties[key] = { type: 'string', enum: (value as any).options };
    }

    required.push(key);
  }

  return { type: 'object', properties, required };
}