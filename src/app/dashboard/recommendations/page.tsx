"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { runRecommendations } from '@/app/dashboard/actions';
import type { GeneratePlantingRecommendationsOutput } from '@/ai/flows/generate-planting-recommendations';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trees } from 'lucide-react';

const formSchema = z.object({
  areaDescription: z.string().min(10, "Por favor, forneça uma descrição mais detalhada da área."),
  environmentalConditions: z.string().min(10, "Por favor, descreva as condições ambientais."),
  desiredOutcomes: z.string().min(10, "Por favor, descreva os resultados desejados."),
});

type FormValues = z.infer<typeof formSchema>;

export default function RecommendationsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<GeneratePlantingRecommendationsOutput | null>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            areaDescription: "",
            environmentalConditions: "",
            desiredOutcomes: "",
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setResults(null);
        
        const response = await runRecommendations(data);

        if (response.success && response.data) {
            setResults(response.data);
            toast({ title: "Recomendações Geradas", description: "Seu plano de plantio está pronto." });
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao gerar recomendações.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recomendações Inteligentes</CardTitle>
                        <CardDescription>Gere recomendações de plantio inteligentes com base em suas necessidades específicas e condições locais.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="areaDescription">Descrição da Área</Label>
                                <Textarea id="areaDescription" {...form.register('areaDescription')} placeholder="Ex: Um quarteirão urbano denso com superfícies de concreto no Jardim São José..." />
                                {form.formState.errors.areaDescription && <p className="text-sm text-destructive">{form.formState.errors.areaDescription.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="environmentalConditions">Condições Ambientais</Label>
                                <Textarea id="environmentalConditions" {...form.register('environmentalConditions')} placeholder="Ex: Exposição total ao sol, solo argiloso, chuvas sazonais moderadas..." />
                                {form.formState.errors.environmentalConditions && <p className="text-sm text-destructive">{form.formState.errors.environmentalConditions.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desiredOutcomes">Resultados Desejados</Label>
                                <Textarea id="desiredOutcomes" {...form.register('desiredOutcomes')} placeholder="Ex: Reduzir a temperatura de pico no verão, aumentar a biodiversidade, criar uma área sombreada para pedestres..." />
                                {form.formState.errors.desiredOutcomes && <p className="text-sm text-destructive">{form.formState.errors.desiredOutcomes.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Gerando..." : "Obter Recomendações"}
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
                            <p className="text-muted-foreground">Correlacionando variáveis e selecionando espécies...</p>
                        </div>
                    </Card>
                )}
                {results ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Espécies Recomendadas</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <ul className="grid gap-3">
                                    {results.recommendedSpecies.map((species, index) => (
                                        <li key={index} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Trees className="h-4 w-4 text-primary" /> {species}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Estratégia de Plantio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{results.plantingStrategy}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Impacto Estimado</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="whitespace-pre-wrap">{results.estimatedImpact}</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p>Suas recomendações de plantio aparecerão aqui.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
