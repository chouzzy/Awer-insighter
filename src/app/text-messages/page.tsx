// src/app/planejar-viagem/page.tsx
'use client';

import { useState } from 'react';
import {
    Box,
    Input,
    NumberInput,
    Button,
    VStack,
    Heading,
    Text,
    Alert,
    Spinner,
    Flex,
    Fieldset,
    Stack,
    Field,
    NativeSelect,
    For
} from '@chakra-ui/react'; // Usando Chakra para UI
import { toaster } from '@/components/ui/toaster';
import { PiAlignCenterVertical } from 'react-icons/pi';

// Interface para a resposta esperada da NOSSA API
interface TripSuggestionResponse {
    suggestion: string; // O texto com as atividades
}

export default function TextMessagesChat() {
    const [destination, setDestination] = useState('');
    const [lengthOfStay, setLengthOfStay] = useState<number>(7); // Valor inicial de 7 dias
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuggestion(null); // Limpa sugestão anterior

        if (!destination.trim() || lengthOfStay <= 0) {
            setError("Por favor, preencha o destino e um número válido de dias.");
            setIsLoading(false);
            return;
        }

        try {
            // Chama a SUA API Route, não a do Gemini diretamente
            const response = await fetch('/api/text-messages', { // Ou o nome que você deu para sua API Route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ destination, lengthOfStay }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro da API: ${response.status}`);
            }

            const data: TripSuggestionResponse = await response.json();
            setSuggestion(data.suggestion);

            toaster.create({ // Feedback de sucesso
                title: "Sugestões Geradas!",
                duration: 3000,
                closable: true
            });

        } catch (err: any) {
            console.error("Erro ao buscar sugestão de viagem:", err);
            setError(err.message || "Não foi possível obter sugestões no momento.");
            toaster.create({ // Feedback de erro
                title: "Erro",
                description: err.message || "Não foi possível obter sugestões.",
                duration: 5000,
                closable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex direction="column" align="center" p={8} maxW="container.md" mx="auto">
            <Heading mb={6}>Planejador de Viagem com IA 🌍</Heading>
            <Flex flexDir={'column'}>
                <form onSubmit={handleSubmit}>
                    <VStack gap={4}>
                        <Fieldset.Root size="lg" maxW="md">
                            <Stack>
                                <Fieldset.Legend>Contact details</Fieldset.Legend>
                                <Fieldset.HelperText>
                                    Please provide your contact details below.
                                </Fieldset.HelperText>
                            </Stack>

                            <Fieldset.Content>
                                <Field.Root>
                                    <Field.Label htmlFor="destination">Destino:</Field.Label>
                                    <Input
                                        id="destination"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="Ex: Paris, Tóquio, Chapada Diamantina"
                                        size="lg"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label htmlFor="lengthOfStay">Duração da Estadia (dias):</Field.Label>
                                    <Input
                                        id="lengthOfStay"
                                        name="days"
                                        type='number'
                                        value={lengthOfStay}
                                        onChange={(e) => {
                                            setLengthOfStay(parseInt(e.target.value) || 1)}}
                                        min={1}
                                        size="lg"
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Country</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field name="country">
                                            <For each={["United Kingdom", "Canada", "United States"]}>
                                                {(item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                )}
                                            </For>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </Fieldset.Content>
                        </Fieldset.Root>


                        <Button
                            type="submit"
                            colorScheme="blue"
                            loading={isLoading}
                            disabled={isLoading || !destination.trim() || lengthOfStay <= 0}
                            size="lg"
                            width="full"
                        >
                            {isLoading ? <Spinner size="sm" /> : "Sugerir Atividades"}
                        </Button>
                    </VStack>
                </form>
            </Flex>

            {error && ( // Exibe erros do hook useChat

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
            )}

            {suggestion && !isLoading && (
                <Flex flexDir={'column'} mt={8} p={6} borderWidth="1px" borderRadius="md" width="100%" bg="bgChatColor">
                    <Heading size="md" mb={4}>Sugestões para {destination}:</Heading>
                    {/* Para renderizar quebras de linha do texto da IA: */}
                    {suggestion.split('\n').map((line, index) => (
                        <Text key={index} mb={2}>{line}</Text>
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

