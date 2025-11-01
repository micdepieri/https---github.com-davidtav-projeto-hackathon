
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { runDiagnostics } from '@/app/dashboard/actions';
import type { DiagnoseUrbanHeatIslandsOutput, DiagnoseUrbanHeatIslandsInput } from '@/ai/flows/diagnose-urban-heat-islands';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import MapPlaceholder from '@/components/map-placeholder';

const formSchema = z.object({
  municipalityName: z.string().min(3, "Por favor, insira o nome do município."),
  municipalityDescription: z.string().min(10, "Por favor, forneça uma descrição mais detalhada."),
});

type FormValues = z.infer<typeof formSchema>;

type ResultsState = {
    output: DiagnoseUrbanHeatIslandsOutput;
    input: DiagnoseUrbanHeatIslandsInput;
} | null;

export default function DiagnosticsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ResultsState>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            municipalityName: "",
            municipalityDescription: "",
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setResults(null);
        
        const formData = new FormData();
        formData.append('municipalityName', data.municipalityName);
        formData.append('municipalityDescription', data.municipalityDescription);

        const response = await runDiagnostics(formData);

        if (response.success && response.data) {
            setResults(response.data);
            toast({ title: "Diagnóstico Concluído", description: "A análise foi finalizada com sucesso." });
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao executar o diagnóstico.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Diagnóstico Automatizado</CardTitle>
                        <CardDescription>Insira o município para identificar ilhas de calor e zonas prioritárias para intervenção verde usando dados do Google Earth Engine.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="municipalityName">Nome do Município</Label>
                                <Input id="municipalityName" {...form.register('municipalityName')} placeholder="Ex: Juquitiba" />
                                {form.formState.errors.municipalityName && <p className="text-sm text-destructive">{form.formState.errors.municipalityName.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="municipalityDescription">Descrição do Município</Label>
                                <Textarea id="municipalityDescription" {...form.register('municipalityDescription')} placeholder="Ex: Uma cidade pequena com Mata Atlântica no entorno e área urbana em crescimento..." />
                                {form.formState.errors.municipalityDescription && <p className="text-sm text-destructive">{form.formState.errors.municipalityDescription.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Analisando..." : "Executar Diagnóstico"}
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
                            <p className="text-muted-foreground">Analisando dados... Isso pode levar um momento.</p>
                        </div>
                    </Card>
                )}
                {results ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo do Diagnóstico</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{results.output.summary}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mapas de Análise</CardTitle>
                                <CardDescription>Visualização dos dados utilizados no diagnóstico.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Cobertura Vegetal (NDVI)</Label>
                                    <Image src={results.input.ndviDataUri} alt="Mapa NDVI" width={400} height={400} className="rounded-md border" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Temperatura da Superfície (LST)</Label>
                                    <Image src={results.input.lstDataUri} alt="Mapa LST" width={400} height={400} className="rounded-md border" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Densidade Populacional</Label>
                                    <Image src={results.input.populationDensityData} alt="Mapa de Densidade Populacional" width={400} height={400} className="rounded-md border" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Infraestrutura Crítica</Label>
                                    <Image src={results.input.infrastructureData} alt="Mapa de Infraestrutura" width={400} height={400} className="rounded-md border" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Zonas Prioritárias</CardTitle>
                                <CardDescription>Principais locais onde a intervenção verde é mais necessária.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MapPlaceholder />
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Local</TableHead>
                                            <TableHead>Risco de Calor</TableHead>
                                            <TableHead>Vulnerabilidade Social</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.output.priorityZones.map((zone, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{zone.location}</TableCell>
                                                <TableCell>{zone.heatRiskLevel}</TableCell>
                                                <TableCell>{zone.socialVulnerability}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Ações Sugeridas</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="whitespace-pre-wrap">{results.output.suggestedActions}</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p>Os resultados da sua análise aparecerão aqui.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

