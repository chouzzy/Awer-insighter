// src/app/api/chat/route.ts
import { streamText, Message } from 'ai';
import { google } from '@ai-sdk/google'; // Importa o provedor Google padrão

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    // Lógica para incluir um system prompt, se desejar
    // const systemPrompt = { role: 'system', content: 'Você é um assistente prestativo especializado na Awer Shop.' };
    // const messagesWithSystemPrompt = [systemPrompt, ...messages];

    const result = streamText({
        model: google('models/gemini-1.5-flash-latest'), // Ou 'models/gemini-pro'
        messages: messages, // Ou messagesWithSystemPrompt se usar o system prompt acima
        // system: "Você é um assistente prestativo." // Outra forma de passar system prompt, verifique a doc
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("[GEMINI_CHAT_API_ERROR_V2]", error);
    let errorMessage = "Erro ao processar sua mensagem com Gemini.";
    if (error.message?.includes("API key") || error.message?.includes("permission")) {
        errorMessage = "Chave de API do Google inválida, não configurada ou sem permissão. Verifique suas variáveis de ambiente e as configurações no GCP.";
    } else if (error.message?.includes("quota")) {
        errorMessage = "Cota da API do Google Gemini excedida.";
    }
    return new Response(JSON.stringify({ error: errorMessage, details: error.message || 'Detalhes indisponíveis' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}