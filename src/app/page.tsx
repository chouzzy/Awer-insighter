// import GeminiChatPage from "@/components/layout/Main/GeminiChat";
import { Header } from "@/components/layout/Header/Header";
import AnalisarRelatorioPage from "@/components/layout/Main/AnalisarRelatorioPage";
import { Container } from "@chakra-ui/react";

export default function Home() {

  return (
    <Container maxW="container.xl" p={0} centerContent>
      <Header/>
      <AnalisarRelatorioPage/>
    </Container>
  );
}
