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
    "Which neighborhoods need more trees?",
    "Generate a planting plan for a sunny area.",
    "Draft a climate plan for my city.",
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
        setMessages([{ id: '0', role: 'assistant', content: "Hello! I'm your climate planning assistant. How can I help you? You can ask me a question or try one of the suggestions below." }]);
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
                let responseContent = "I'm not sure how to help with that. Could you please rephrase? You can also use the tools in the sidebar directly for specific tasks.";

                if (messageContent.toLowerCase().includes('neighborhood') || messageContent.toLowerCase().includes('diagnos') || messageContent.toLowerCase().includes('need more trees')) {
                    responseContent = "To find neighborhoods that need more trees, please use the 'Diagnostics' tool. You will need to provide geospatial data (NDVI, LST, population, and infrastructure) for your municipality.";
                } else if (messageContent.toLowerCase().includes('planting plan') || messageContent.toLowerCase().includes('recommend')) {
                    responseContent = "I can help with that. To generate a planting plan, please navigate to the 'Recommendations' tool and describe the area, environmental conditions, and your desired outcomes.";
                } else if (messageContent.toLowerCase().includes('climate plan') || messageContent.toLowerCase().includes('draft')) {
                    responseContent = "I can help draft a climate plan. Please use the 'Plan Generator' tool and provide the municipality name, a description of the problem, and suggested intervention areas.";
                }
                
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: responseContent
                };
                setMessages(prev => [...prev, assistantMessage]);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    };
    
    return (
        <div className="grid flex-1 items-start gap-4">
            <Card className="h-[calc(100vh-8rem)] flex flex-col">
                <CardHeader>
                    <CardTitle>Conversational Assistant</CardTitle>
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
                                placeholder="Ask about climate planning..."
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
