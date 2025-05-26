// src/app/api/analyze-pdf/route.ts
import { generateText, type Message } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Precisa ser 'nodejs' para usar 'fs'

// Esta API Route será chamada com um GET para simplificar o teste
export async function POST(req: Request) {
  try {
    const {messages}: { messages: Message[] } = await req.json();

    // delete messages[0].parts

    // // 3. Chamar generateText
    const result = await generateText({
      model: google('models/gemini-1.5-flash-latest'), // Modelo que suporte multimodal/PDF
      // system: "Você é um especialista em analisar documentos fiscais.", // Opcional
      messages: messages,
    });

    // Retorna a resposta da IA
    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // console.error("[GEMINI_PDF_ANALYSIS_ERROR]", error);
    // ... (tratamento de erro como antes) ...
    return NextResponse.json(
      { error: "Erro ao analisar o PDF com Gemini.", details: error.message || 'Detalhes indisponíveis' },
      { status: 500 }
    );
  }
}
