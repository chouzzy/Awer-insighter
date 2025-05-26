// src/app/api/generate-trip-idea/route.ts (Exemplo de nome)
import { generateText, Message } from 'ai'; // generateText é para resposta única
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Espera um objeto com uma propriedade 'promptInput' ou similar
    const { destination, lengthOfStay }: { destination: string, lengthOfStay: number } = await req.json();

    if (!destination || !lengthOfStay) {
      return new Response(JSON.stringify({ error: "Parâmetros 'destination' e 'lengthOfStay' são obrigatórios." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const finalPrompt = `I am planning a trip to ${destination} for ${lengthOfStay} days. Please suggest the best tourist activities for me to do.`;

    const result = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      prompt: finalPrompt, // Usa o prompt montado
    });

    // Retorna apenas o texto gerado
    return new Response(JSON.stringify({ suggestion: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[API_GENERATE_ERROR]", error);
    // ... seu tratamento de erro ...
    return new Response(JSON.stringify({ error: "Erro no servidor" /* ... */ }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}