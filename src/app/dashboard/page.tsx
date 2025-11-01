
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { runDiagnostics, generateDescriptionForCity } from '@/app/dashboard/actions';
import type { DiagnoseUrbanHeatIslandsOutput, DiagnoseUrbanHeatIslandsInput } from '@/ai/flows/diagnose-urban-heat-islands';
import { useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Sparkles } from 'lucide-react';
import MapPlaceholder from '@/components/map-placeholder';

const formSchema = z.object({
  municipalityDescription: z.string().min(10, "Por favor, forneça uma descrição mais detalhada."),
});

type FormValues = z.infer<typeof formSchema>;

type ResultsState = {
    output: DiagnoseUrbanHeatIslandsOutput;
    input: DiagnoseUrbanHeatIslandsInput;
} | null;

interface UserProfile {
    id: string;
    displayName: string;
    cityId: string;
}

interface City {
    id: string;
    name: string;
}

export default function DiagnosticsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [results, setResults] = useState<ResultsState>(null);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, loading: userProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const cityRef = useMemo(() => {
        if (!userProfile || !userProfile.cityId || !firestore) return null;
        return doc(firestore, 'cities', userProfile.cityId);
    }, [userProfile, firestore]);
    const { data: city, loading: cityLoading } = useDoc<City>(cityRef);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            municipalityDescription: "",
        }
    });

    const handleGenerateDescription = async () => {
        if (!city?.name) {
            toast({
                variant: "destructive",
                title: "Cidade não encontrada",
                description: "O seu usuário não está vinculado a uma cidade.",
            });
            return;
        }
        setIsGeneratingDesc(true);
        const response = await generateDescriptionForCity(city.name);
        if (response.success && response.description) {
            form.setValue('municipalityDescription', response.description);
            toast({ title: "Descrição Gerada", description: "A descrição do município foi preenchida." });
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao gerar a descrição.",
            });
        }
        setIsGeneratingDesc(false);
    };

    const onSubmit = async (data: FormValues) => {
        if (!city?.name) {
            toast({
                variant: "destructive",
                title: "Cidade não encontrada",
                description: "O seu usuário não está vinculado a uma cidade. Por favor, entre em contato com o administrador.",
            });
            return;
        }

        setIsLoading(true);
        setResults(null);
        
        const formData = new FormData();
        formData.append('municipalityName', city.name);
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
    
    const isLoadingData = userProfileLoading || cityLoading;

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Diagnóstico Automatizado</CardTitle>
                        {isLoadingData ? (
                             <CardDescription>Carregando dados da cidade...</CardDescription>
                        ) : city ? (
                             <CardDescription>
                                Identificar ilhas de calor e zonas prioritárias para intervenção verde em <strong>{city.name}</strong> usando dados do Google Earth Engine.
                            </CardDescription>
                        ) : (
                             <CardDescription>Vincule seu usuário a uma cidade para iniciar o diagnóstico.</CardDescription>
                        )}
                       
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="municipalityDescription">Descrição do Município</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDesc || isLoadingData || !city}>
                                        {isGeneratingDesc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        Gerar com IA
                                    </Button>
                                </div>
                                <Textarea id="municipalityDescription" {...form.register('municipalityDescription')} placeholder="Ex: Uma cidade pequena com Mata Atlântica no entorno e área urbana em crescimento..." />
                                {form.formState.errors.municipalityDescription && <p className="text-sm text-destructive">{form.formState.errors.municipalityDescription.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading || isLoadingData || !city}>
                                {(isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
