"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { runPlanGeneration } from '@/app/dashboard/actions';
import type { GenerateClimatePlanOutput } from '@/ai/flows/generate-climate-plan';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download } from 'lucide-react';

const formSchema = z.object({
  municipalityName: z.string().min(3, "O nome do município é obrigatório."),
  problemDescription: z.string().min(10, "Por favor, forneça uma descrição mais detalhada do problema."),
  suggestedAreas: z.string().min(10, "Por favor, sugira algumas áreas para intervenção."),
});

type FormValues = z.infer<typeof formSchema>;

export default function PlanGeneratorPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<GenerateClimatePlanOutput | null>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            municipalityName: "",
            problemDescription: "",
            suggestedAreas: "",
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setResults(null);
        
        const response = await runPlanGeneration(data);

        if (response.success && response.data) {
            setResults(response.data);
            toast({ title: "Plano Climático Gerado", description: "Seu plano climático e documentos de apoio estão prontos." });
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao gerar o plano.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerador de Plano Climático</CardTitle>
                        <CardDescription>Gere automaticamente um rascunho de plano climático e documentação de apoio para seu município.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="municipalityName">Nome do Município</Label>
                                <Input id="municipalityName" {...form.register('municipalityName')} placeholder="Ex: Juquitiba/SP" />
                                {form.formState.errors.municipalityName && <p className="text-sm text-destructive">{form.formState.errors.municipalityName.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="problemDescription">Descrição do Problema</Label>
                                <Textarea id="problemDescription" {...form.register('problemDescription')} placeholder="Ex: Alta concentração de ilhas de calor nos bairros centrais, falta de cobertura verde..." />
                                {form.formState.errors.problemDescription && <p className="text-sm text-destructive">{form.formState.errors.problemDescription.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="suggestedAreas">Áreas de Intervenção Sugeridas</Label>
                                <Textarea id="suggestedAreas" {...form.register('suggestedAreas')} placeholder="Ex: Jardim Aurora, Vila São Roque, áreas ao redor da escola municipal..." />
                                {form.formState.errors.suggestedAreas && <p className="text-sm text-destructive">{form.formState.errors.suggestedAreas.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Gerando..." : "Gerar Plano Climático"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                {isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground">Elaborando plano climático e documentos...</p>
                        </div>
                    </Card>
                )}
                {results ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Plano Climático Gerado</CardTitle>
                                <Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Baixar</Button>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-sm">{results.climatePlan}</pre>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Documentação de Apoio</CardTitle>
                                <Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Baixar</Button>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-sm">{results.supportingDocumentation}</pre>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p>Seu plano climático gerado aparecerá aqui.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
