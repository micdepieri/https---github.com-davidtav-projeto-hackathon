"use client";

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const suggestedQuestions = [
    "Quais bairros precisam de mais árvores?",
    "Gerar um plano de plantio para uma área ensolarada.",
    "Elaborar um plano climático para minha cidade.",
];

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setMessages([{ id: '0', role: 'assistant', content: "Olá! Sou seu assistente de planejamento climático. Como posso ajudar? Você pode me fazer uma pergunta ou tentar uma das sugestões abaixo." }]);
    }, []);

    const handleSendMessage = async (messageContent: string) => {
        if (!messageContent.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setInput('');

        // This is a simplified mock of the assistant's logic.
        // It guides the user to the correct tool rather than executing the flow directly.
        setTimeout(() => {
            try {
                let responseContent = "Não tenho certeza de como ajudar com isso. Você poderia reformular? Você também pode usar as ferramentas na barra lateral diretamente para tarefas específicas.";

                if (messageContent.toLowerCase().includes('bairro') || messageContent.toLowerCase().includes('diagnos') || messageContent.toLowerCase().includes('precisam de mais árvores')) {
                    responseContent = "Para encontrar bairros que precisam de mais árvores, por favor, use a ferramenta 'Diagnóstico'. Você precisará fornecer dados geoespaciais (NDVI, LST, população e infraestrutura) para o seu município.";
                } else if (messageContent.toLowerCase().includes('plano de plantio') || messageContent.toLowerCase().includes('recomenda')) {
                    responseContent = "Eu posso ajudar com isso. Para gerar um plano de plantio, por favor, navegue até a ferramenta 'Recomendações' e descreva a área, as condições ambientais e os resultados desejados.";
                } else if (messageContent.toLowerCase().includes('plano climático') || messageContent.toLowerCase().includes('elaborar')) {
                    responseContent = "Eu posso ajudar a elaborar um plano climático. Por favor, use a ferramenta 'Gerador de Plano' e forneça o nome do município, uma descrição do problema e as áreas de intervenção sugeridas.";
                }
                
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: responseContent
                };
                setMessages(prev => [...prev, assistantMessage]);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Algo deu errado.' });
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    };
    
    return (
        <div className="grid flex-1 items-start gap-4">
            <Card className="h-[calc(100vh-8rem)] flex flex-col">
                <CardHeader>
                    <CardTitle>Assistente Conversacional</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div ref={scrollAreaRef} className="flex-1 overflow-y-auto pr-4 space-y-4">
                        {messages.map((message) => (
                            <div key={message.id} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                                {message.role === 'assistant' && (
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("max-w-xl rounded-lg p-3 text-sm shadow-sm", message.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.role === 'user' && (
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                                <div className="max-w-md rounded-lg p-3 text-sm bg-muted flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-auto space-y-2 pt-4 border-t">
                         <div className="flex gap-2 flex-wrap">
                            {suggestedQuestions.map(q => (
                                <Button key={q} variant="outline" size="sm" onClick={() => handleSendMessage(q)} disabled={isLoading}>
                                    {q}
                                </Button>
                            ))}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pergunte sobre planejamento climático..."
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
