// src/app/gemini-chat/page.tsx
'use client';

import { useChat, type Message, type CreateMessage } from 'ai/react'; // Importa useChat e o tipo Message
import { v4 } from 'uuid'; // Para gerar IDs únicos
import {
    Box,
    Input,
    Button,
    VStack,
    Text,
    Heading,
    Flex,
    HStack,
    Spinner, // Para o indicador de loading
    Alert,   // Para mostrar erros
    AlertTitle,
    AlertDescription,
    Fieldset,
    Stack,
    Field,
} from '@chakra-ui/react'; // Usando Chakra para UI
import { PiAlignCenterVertical } from 'react-icons/pi';
import { useEffect, useRef, useState } from 'react';
import { toaster, Toaster } from '@/components/ui/toaster';
import axiosApi from '@/services/axios';
import { CoreMessage } from 'ai';

// Se você tiver um tema customizado Chakra, envolva com ChakraProvider no layout.tsx ou providers.tsx

export default function MessagePartPromptsPage() {
    const [messages, setMessages] = useState<string>(''); // Array de mensagens


    const [error, setError] = useState<Error>(); // Array de mensagens
    const [isLoading, setIsLoading] = useState<boolean>(false); // Array de mensagens

    const [textInput, setTextInput] = useState(''); // Estado para o input de texto
    const [fileInput, setFileInput] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Para resetar o input de arquivo


    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); // Isso retorna data URL: "data:mime/type;base64,BASE64_STRING"
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFileInput(event.target.files[0]);
        }
    };

    const handleCustomSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true)
        if (!textInput.trim() && !fileInput) {
            toaster.create({ title: "Por favor, digite uma mensagem ou selecione um arquivo." }); // Use toast
            return;
        }

        const messageContent: CreateMessage['content'] = []; // Para juntar o texto

        if (textInput.trim()) {
            messageContent.push({ type: 'text', text: textInput.trim() });
        }

        if (fileInput) {
            try {
                const base64String = await convertFileToBase64(fileInput);
                // O Vercel AI SDK e o provider do Google esperam que a parte 'image' ou 'data'
                // seja uma string (URL ou base64) ou um Uint8Array/Buffer.
                // Para o Gemini, ao enviar dados inline, você precisa do mimeType e dos dados em base64 (sem o prefixo "data:mime/type;base64,").
                const base64Data = base64String.split(',')[1]; // Pega só a parte base64

                messageContent.push({
                    type: 'file',
                    mimeType: fileInput.type,
                    data: base64Data
                });
                toaster.create({ title: `Arquivo ${fileInput.name} (${fileInput.type}) pronto para envio.` });
            } catch (err) {
                console.error("Erro ao converter arquivo:", err);
                // alert("Erro ao processar o arquivo."); // Use toast
                setIsLoading(false)
                return;
            }
        }

        if (messageContent.length > 0) {
            let newMessage: CoreMessage[] | Omit<Message, "id">[] | undefined = [{
                role: 'user',
                content: messageContent,
            }]
            const response = await axiosApi.post('message-part-prompts', { messages: newMessage }); // Ou o nome que você deu para sua API Route
            setMessages((prev) => prev + '\n' + response.data.text); // Atualiza o estado com a resposta da IA
            if (response.status != 200) {
                setError(new Error(`Erro da API: ${response.status}`));
                setIsLoading(false);
                const errorData = await response.data;
                setError(errorData)
                setIsLoading(false)
                throw new Error(errorData.error || `Erro da API: ${response.status}`);
            }
        }


        // Limpar inputs
        setIsLoading(false);
        setTextInput('');
        setFileInput(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reseta o campo de arquivo
        }
    };

    return (
        <Flex direction="column" h="calc(100vh - 120px)" /* Exemplo de altura, ajuste */ p={4} maxW="container.lg" mx="auto" w='100%'> {/* Aumentei maxW */}
            <Heading mb={6} textAlign="center">
                Chat com Gemini (Vercel AI SDK)
            </Heading>
            <Flex
                w='100%'
                flexDir={'column'}
                gap={4}
                align="stretch"
                overflowY="auto" // Permite scroll
                flex={1} // Ocupa o espaço disponível
                borderColor="gray.200"
                borderRadius="md"
                bgColor={'bgChatColor'}
                p={4}
                mb={4}
            >
                {messages.split('\n').map((line, index) => (
                    <Text key={index}>
                        {line}
                        <br />
                    </Text>
                ))}
            </Flex>

            {error && ( // Exibe erros do hook useChat

                <Alert.Root>
                    <Alert.Indicator>
                        <PiAlignCenterVertical />
                    </Alert.Indicator>
                    <Alert.Content>
                        <Box>
                            <Alert.Title>Ocorreu um erro!</Alert.Title>
                            <Alert.Description>{error.message}</Alert.Description>
                        </Box>
                    </Alert.Content>
                </Alert.Root>
            )}

            <form onSubmit={handleCustomSubmit}>

                <VStack gap={4}>

                    <Fieldset.Root size="lg" maxW="md">

                        <Fieldset.Content>
                            <Stack>
                                <Field.Root>

                                    <Field.Label htmlFor="text-input">Mensagem de Texto</Field.Label>
                                    <Input
                                        id="text-input"
                                        value={textInput}
                                        placeholder="Digite sua mensagem..."
                                        onChange={(e) => setTextInput(e.target.value)}
                                        disabled={isLoading}
                                        size="lg"
                                    />
                                </Field.Root>
                            </Stack>

                            <Field.Root>
                                <Field.Label htmlFor="file-input"> Adicionar arquivo (ex: PDF, Imagem):
                                    <Input
                                        id="file-input"
                                        type="file"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                        ref={fileInputRef} // Para resetar o campo
                                        size="md" // Chakra usa 'sm', 'md', 'lg' para tamanho
                                    // accept=".pdf,image/*" // Especifique os tipos de arquivo aceitos
                                    />
                                </Field.Label>
                            </Field.Root>

                        </Fieldset.Content>
                    </Fieldset.Root>


                    <Button type="submit" colorScheme="blue" loading={isLoading} disabled={isLoading || (!textInput.trim() && !fileInput)} size="lg" width="full">
                        {isLoading ? <Spinner size="sm" /> : 'Enviar Mensagem'}
                    </Button>
                </VStack>
            </form >
            <Toaster />
        </Flex >
    );
}

