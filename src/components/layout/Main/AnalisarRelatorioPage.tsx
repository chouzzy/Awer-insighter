// src/app/analisar-relatorio/page.tsx
'use client';

import { toaster, Toaster } from '@/components/ui/toaster';
import axiosApi from '@/services/axios';
import {
    Box,
    Button,
    Heading,
    Input,
    VStack,
    Text,
    Spinner, // Para indicar loading
    Flex,
    Fieldset,
    Stack,
    Field,
    Alert,
    FileUpload,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { HiUpload } from 'react-icons/hi';
import { PiAlignCenterVertical } from 'react-icons/pi';

// Interface para a resposta esperada da nossa API de análise
interface AnaliseResponse {
    // Defina aqui os campos que você espera da sua API
    // Exemplo:
    // faturamentoTotal?: number;
    // mesMaiorFaturamento?: string;
    // topProdutos?: Array<{ nome: string; receita: number }>;
    // analiseTendencia?: string;
    // sumarioIA?: string; // O resumo textual da IA
    // // ou um campo mais genérico:
    insights?: Insights;
    error?: string;
}

interface Insights {
    summary: string;
    keyInsights: string[];
    // Adicione outros campos conforme necessário
}

export default function AnalisarRelatorioPage() {
    const [contextText, setContextText] = useState<string>(''); // Texto de contexto ou pergunta
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnaliseResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Para resetar o input de arquivo

    const handleFileChange = (inputFile: File[]) => {
        toaster.create({
            title: 'Arquivo Selecionado',
        })
        console.log("Arquivo selecionado:", inputFile);
        if (inputFile && inputFile[0]) {
            const file = inputFile[0];
            // Validação simples do tipo de arquivo (ex: CSV, Excel)
            // Adicione os MIME types corretos que você vai suportar
            const allowedTypes = [
                'text/csv',
                'application/vnd.ms-excel', // .xls
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
                // Adicione 'application/pdf' se for suportar PDF desde o início
            ];
            if (!allowedTypes.includes(file.type)) {
                toaster.create({
                    title: 'Tipo de Arquivo Inválido',
                    description: `Por favor, selecione um arquivo CSV ou Excel. Tipo selecionado: ${file.type}`,
                    type: 'error',
                    duration: 5000,
                    closable: true,
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Limpa o input
                return;
            }
            setSelectedFile(file);
            setAnalysisResult(null); // Limpa resultado anterior ao selecionar novo arquivo
            setError(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFile) {
            toaster.create({
                title: 'Nenhum arquivo selecionado',
                description: 'Por favor, selecione um relatório para analisar.',
                type: 'warning',
                duration: 3000,
                closable: true,
            });
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);
        setError(null);

        const formData = new FormData();
        console.log('selectedFile')
        console.log(selectedFile)
        formData.append('reportFile', selectedFile); // 'reportFile' é o nome do campo que o backend espera

        // Adicionar outras informações ao FormData se necessário, ex: tipo de análise
        // formData.append('analiseTipo', 'faturamentoMensal');

        try {          // Chame sua API Route (ex: /api/analyze-report)
            const response = await axiosApi.post('analyze-report', formData);

            const data: AnaliseResponse = await response.data;

            if (!response.status || response.status !== 200) {
                throw new Error(data.error || `Erro da API: ${response.status}`);
            }

            setAnalysisResult(data);
            toaster.create({
                title: 'Análise Concluída!',
                type: 'success',
                duration: 3000,
                closable: true,
            });
            console.log("Resultado da análise:", data);

        } catch (err: any) {
            console.error("Erro ao enviar relatório para análise:", err);
            setError(err.message || "Ocorreu um erro ao processar seu relatório.");
            toaster.create({
                title: 'Erro na Análise',
                description: err.message || "Ocorreu um erro.",
                type: 'error',
                duration: 5000,
                closable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex direction="column" align="center" p={8} maxW="container.md" mx="auto">
            <Heading mb={6} textAlign="center">Awer Simplifier - Análise de Relatórios</Heading>
            <Flex width="100%" borderWidth="1px" borderRadius="lg" p={6} boxShadow="md">
                <form onSubmit={handleSubmit}>
                    <Fieldset.Root size="lg">
                        <Stack gap={2} mb={6}> {/* Usando Stack para agrupar Legend e HelperText */}
                            <Fieldset.Legend fontSize="xl" fontWeight="semibold">Envie seu Relatório</Fieldset.Legend>
                            <Fieldset.HelperText>
                                Faça upload do seu arquivo (CSV, Excel ou PDF) e adicione um contexto ou pergunta para a IA analisar.
                            </Fieldset.HelperText>
                        </Stack>

                        <Fieldset.Content>
                            <VStack gap={6}> {/* VStack para empilhar os campos */}
                                <Field.Root width="100%">
                                    <Field.Label htmlFor="contextText">Contexto ou Pergunta (Opcional):</Field.Label>
                                    <Input
                                        as="textarea" // Para permitir mais texto
                                        id="contextText"
                                        name="contextText"
                                        value={contextText}
                                        onChange={(e) => setContextText(e.target.value)}
                                        placeholder="Ex: 'Analise as vendas do último trimestre e identifique os top 3 produtos.' ou 'Quais foram as principais despesas em Janeiro?'"
                                        size="lg"
                                        minHeight="100px" // Altura mínima para textarea
                                    />
                                    <Field.HelperText>Descreva o que você gostaria que a IA analisasse no arquivo.</Field.HelperText>
                                </Field.Root>


                                <FileUpload.Root gap="1" accept={[
                                    "image/png",
                                    "image/jpeg",
                                    "application/pdf",
                                    "application/vnd.ms-excel",
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                ]} width="100%" onFileChange={(e) => { handleFileChange(e.acceptedFiles) }}>
                                    <FileUpload.HiddenInput />
                                    <FileUpload.Label cursor={'pointer'}>Upload file</FileUpload.Label>
                                    <FileUpload.Trigger asChild>
                                        <Button variant="outline" size="sm">
                                            <HiUpload /> Upload file
                                            <FileUpload.FileText />
                                        </Button>
                                    </FileUpload.Trigger>

                                </FileUpload.Root>
                            </VStack>
                        </Fieldset.Content>

                        <Button
                            type="submit"
                            colorScheme="blue" // Ou sua cor 'brand'
                            loading={isLoading}
                            // Desabilita se estiver carregando OU (não houver arquivo E não houver texto de contexto)
                            disabled={isLoading || (!selectedFile && !contextText.trim())}
                            size="lg"
                            width="full"
                            mt={8} // Margem no topo do botão
                        >
                            {isLoading ? <Spinner size="sm" /> : "Analisar Relatório"}
                        </Button>
                    </Fieldset.Root>
                </form>
            </Flex>

            {
                error && (
                    <Alert.Root>
                        <Alert.Indicator>
                            <PiAlignCenterVertical />
                        </Alert.Indicator>
                        <Alert.Content>
                            <Box>
                                <Alert.Title>Ocorreu um erro!</Alert.Title>
                                <Alert.Description>{error}</Alert.Description>
                            </Box>
                        </Alert.Content>
                    </Alert.Root>
                )
            }

            {
                analysisResult && !isLoading && (
                    <Box mt={8} p={6} borderWidth="1px" borderRadius="lg" width="100%" bg="gray.50" _dark={{ bg: "gray.700" }}>
                        <Heading size="md" mb={4}>Resultados da Análise:</Heading>
                        {/* Exemplo de como exibir os resultados - adapte conforme sua interface AnaliseResponse */}
                        <Flex>
                            <Text>
                                {analysisResult.insights?.summary}
                            </Text>
                        </Flex>
                        <Stack gap={2} mt={4}>
                            {analysisResult.insights?.keyInsights.map((insight, index) => (
                                <Text key={index} fontWeight="medium" fontSize={'xs'}>- {insight}</Text>
                            ))}
                        </Stack>
                        {/* {analysisResult.sumarioIA && (
                            <Box mb={4}>
                                <Text fontWeight="bold">Resumo da IA:</Text>
                                {analysisResult.sumarioIA.split('\n').map((line, idx) => <Text key={idx}>{line}</Text>)}
                            </Box>
                        )}
                        {analysisResult.faturamentoTotal !== undefined && <Text>Faturamento Total: R$ {analysisResult.faturamentoTotal.toFixed(2)}</Text>}
                        {analysisResult.mesMaiorFaturamento && <Text>Mês de Maior Faturamento: {analysisResult.mesMaiorFaturamento}</Text>}
                        {analysisResult.topProdutos && (
                            <Box mt={2}>
                                <Text fontWeight="bold">Top Produtos:</Text>
                                <VStack align="start">
                                    {analysisResult.topProdutos.map((p, i) => <Text key={i}>- {p.nome}: R$ {p.receita.toFixed(2)}</Text>)}
                                </VStack>
                            </Box>
                        )} */}
                        {/* Adicione aqui a exibição de gráficos se planejar */}
                    </Box>
                )
            }
            <Toaster />
        </Flex >
    );
}
