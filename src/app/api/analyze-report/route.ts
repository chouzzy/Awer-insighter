// src/app/api/analyze-report/route.ts
import { generateObject, type Message } from 'ai'; // Usaremos generateObject para uma resposta estruturada
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import Papa from 'papaparse'; // Para parsear CSV
import * as XLSX from 'xlsx'; // Para parsear Excel
import { z } from 'zod'; // Para definir o schema da resposta da IA

export const runtime = 'nodejs'; // Necessário para 'fs' (implícito pelo formidable/multer) e 'xlsx'

// Schema Zod para a resposta que esperamos da IA
const AnalysisResponseSchema = z.object({
  summary: z.string().describe("Um breve resumo em linguagem natural dos principais achados do relatório."),
  keyInsights: z.array(z.string()).describe("Uma lista de 2 a 3 insights ou pontos de atenção principais."),
  // Adicione outros campos estruturados que você quer que a IA retorne
  // Exemplo:
  // totalRevenue: z.number().optional().describe("Faturamento total, se aplicável e encontrado."),
  // topItems: z.array(z.object({ name: z.string(), value: z.number() })).optional().describe("Top itens e seus valores."),
});


export async function POST(req: Request) {
  try {
    console.log('req')
    const formData = await req.formData();
    const file = formData.get('reportFile') as File | null;
    const contextText = formData.get('contextText') as string | null;

    if (!file && !contextText?.trim()) {
      return NextResponse.json({ error: "Nenhum arquivo ou contexto fornecido." }, { status: 400 });
    }

    let fileContentString: string | null = null;
    let fileTypeDetected: string | null = null;

    if (file) {
      console.log(`Arquivo recebido: ${file.name}, Tipo: ${file.type}, Tamanho: ${file.size}`);
      fileTypeDetected = file.type;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'text/csv') {
        // Parseia CSV
        const csvData = Papa.parse(buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
        fileContentString = JSON.stringify(csvData.data); // Envia os dados parseados como JSON string
      } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Parseia Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Pega a primeira planilha
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        fileContentString = JSON.stringify(jsonData);
      } else if (file.type === 'application/pdf') {
        // Para PDF, enviar como base64 e instruir a IA
        fileContentString = buffer.toString('base64');
        // O prompt para PDF precisaria ser diferente, ou a IA precisaria ser multimodal e
        // você usaria a estrutura de 'parts' como discutimos para o Gemini 1.5
        // Por enquanto, este exemplo foca em CSV/Excel para dados tabulares.
        // Se for PDF, a abordagem de 'parts' com mimeType e data (base64) na Message é melhor.
        // Para simplificar este exemplo inicial, vamos focar em CSV/Excel para `generateObject`
        // e assumir que a IA que processa PDF viria em outra rota ou com `streamText` e `parts`.
        // Por enquanto, vamos retornar um erro se for PDF neste endpoint específico.
        return NextResponse.json({ error: "Processamento de PDF ainda não implementado neste endpoint. Use CSV ou Excel." }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Formato de arquivo não suportado. Use CSV ou Excel." }, { status: 400 });
      }
    }

    // Montar o prompt para a IA
    let promptForAI = "";
    if (contextText?.trim()) {
      promptForAI += `Contexto/Pergunta do usuário: "${contextText.trim()}".\n\n`;
    }

    if (fileContentString) {
      promptForAI += `Analise os seguintes dados do relatório (tipo: ${fileTypeDetected}):\n${fileContentString}\n\nCom base nos dados e no contexto fornecido (se houver), identifique os principais insights.`;
    } else {
      // Se não houver arquivo, a IA tentará responder apenas com base no contextText
      promptForAI += `Responda à pergunta do usuário ou forneça informações com base no seguinte contexto: "${contextText?.trim()}"`;
    }

    console.log("Prompt enviado para a IA (sem os dados completos do arquivo para economizar log):", promptForAI.substring(0, 500) + (fileContentString ? " ... [DADOS DO ARQUIVO OMITIDOS DO LOG] ..." : ""));

    const { object: analysis } = await generateObject({
      model: google('models/gemini-1.5-flash-latest'), // Ou gemini-pro
      schema: AnalysisResponseSchema,
      prompt: promptForAI,
    });

    console.log("Análise recebida da IA:", analysis);

    return NextResponse.json({ insights: analysis });

  } catch (error: any) {
    console.error("[ANALYZE_REPORT_API_ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao analisar o relatório.", details: error.message || 'Detalhes indisponíveis' },
      { status: 500 }
    );
  }
}
