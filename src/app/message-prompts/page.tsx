// src/app/gemini-chat/page.tsx
'use client';

import { useChat, type Message } from 'ai/react'; // Importa useChat e o tipo Message
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
} from '@chakra-ui/react'; // Usando Chakra para UI
import { PiAlignCenterVertical } from 'react-icons/pi';
import { useEffect } from 'react';

// Se você tiver um tema customizado Chakra, envolva com ChakraProvider no layout.tsx ou providers.tsx

export default function MessagePromptsPage() {
    const {
        messages,          // Array de mensagens (user, assistant, system, tool)
        input,             // Valor atual do campo de input
        handleInputChange, // Função para atualizar 'input' quando o usuário digita
        handleSubmit,      // Função para ser chamada no submit do formulário (envia a mensagem)
        isLoading,         // Booleano: true enquanto a IA está gerando a resposta
        error,             // Objeto de erro, se ocorrer algum
        // reload,         // Função para reenviar a última mensagem do usuário
        // stop,           // Função para parar a geração da IA
        // setMessages,    // Função para definir manualmente o array de mensagens
        // append,         // Função para adicionar uma mensagem programaticamente
    } = useChat({
        api: '/api/message-prompts', // Aponta para a sua API Route que usa Gemini
        // Configurações opcionais do useChat:
        // initialMessages: [], // Mensagens iniciais para popular o chat
        // id: 'meu-chat-unico', // Se você tiver múltiplos chats na mesma página
        // body: { /* dados adicionais para enviar com cada requisição POST */ },
        // onResponse: (response) => { console.log("Resposta da API recebida:", response); },
        // onFinish: (message) => { console.log("Geração da IA finalizada:", message); },
        onError: (err) => {
            console.error("Erro no hook useChat:", err);
            // Você pode usar um toast aqui para uma melhor UX de erro
            // toaster.create({ title: 'Erro no Chat', description: err.message, status: 'error' });
        },
    });

    useEffect(() => {
        console.log(messages)
    }, [messages]);

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
                {messages.length > 0
                    ? messages.map((m: Message) => ( // Tipando 'm' como Message
                        <Box
                            key={m.id}
                            alignSelf={m.role === 'user' ? 'flex-end' : 'flex-start'}
                            bg={m.role === 'user' ? 'blue.500' : 'gray.100'}
                            color={m.role === 'user' ? 'white' : 'black'}
                            p={3}
                            borderRadius="lg"
                            maxWidth="80%"
                            wordBreak="break-word" // Para quebrar palavras longas
                        >
                            <Text fontWeight="bold" mb={1} fontSize="sm">
                                {m.role === 'user' ? 'Você: ' : 'Gemini: '}
                            </Text>
                            {/* Renderiza o conteúdo linha por linha se houver \n */}
                            {m.content.split('\n').map((line, index) => (
                                <Text key={index}>{line}</Text>
                            ))}
                        </Box>
                    ))
                    : <Text color="gray.500" textAlign="center">Nenhuma mensagem ainda. Comece a conversa!</Text>}
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

            <form onSubmit={handleSubmit}>
                <HStack>
                    <Input
                        value={input}
                        placeholder="Digite sua mensagem para o Gemini..."
                        onChange={handleInputChange}
                        disabled={isLoading} // Desabilita enquanto a IA está respondendo
                        size="lg"
                        autoFocus // Foca no input ao carregar a página
                    />
                    <Button type="submit" colorScheme="blue" loading={isLoading} disabled={isLoading || !input.trim()} size="lg">
                        {isLoading ? <Spinner size="sm" /> : 'Enviar'}
                    </Button>
                </HStack>
            </form>
        </Flex>
    );
}
