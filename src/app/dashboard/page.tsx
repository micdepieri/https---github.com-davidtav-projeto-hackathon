"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { runDiagnostics } from '@/app/dashboard/actions';
import type { DiagnoseUrbanHeatIslandsOutput } from '@/ai/flows/diagnose-urban-heat-islands';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload } from 'lucide-react';
import MapPlaceholder from '@/components/map-placeholder';

const formSchema = z.object({
  municipalityDescription: z.string().min(10, "Por favor, forneça uma descrição mais detalhada."),
  ndviData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "O arquivo de dados NDVI é obrigatório."),
  lstData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "O arquivo de dados LST é obrigatório."),
  populationDensityData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "O arquivo de dados de densidade populacional é obrigatório."),
  infrastructureData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "O arquivo de dados de infraestrutura é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

const FileInput = ({ label, name, register, errors }: { label: string; name: keyof FormValues; register: any; errors: any }) => (
    <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <div className="relative">
            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id={name} type="file" className="pl-10" {...register(name)} />
        </div>
        {errors[name] && <p className="text-sm text-destructive">{errors[name].message}</p>}
    </div>
);


export default function DiagnosticsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<DiagnoseUrbanHeatIslandsOutput | null>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            municipalityDescription: "",
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setResults(null);
        
        const formData = new FormData();
        formData.append('municipalityDescription', data.municipalityDescription);
        formData.append('ndviData', data.ndviData[0]);
        formData.append('lstData', data.lstData[0]);
        formData.append('populationDensityData', data.populationDensityData[0]);
        formData.append('infrastructureData', data.infrastructureData[0]);

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
                        <CardDescription>Carregue dados geoespaciais para identificar ilhas de calor urbanas e zonas prioritárias para intervenção verde.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="municipalityDescription">Descrição do Município</Label>
                                <Textarea id="municipalityDescription" {...form.register('municipalityDescription')} placeholder="Ex: Juquitiba/SP, uma cidade pequena com Mata Atlântica no entorno..." />
                                {form.formState.errors.municipalityDescription && <p className="text-sm text-destructive">{form.formState.errors.municipalityDescription.message}</p>}
                            </div>
                            <FileInput label="Cobertura Vegetal (NDVI)" name="ndviData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Temperatura da Sup. (LST)" name="lstData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Densidade Populacional" name="populationDensityData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Infraestrutura Crítica" name="infrastructureData" register={form.register} errors={form.formState.errors} />
                            
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
                            <p className="text-muted-foreground">Analisando dados geoespaciais... Isso pode levar um momento.</p>
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
                                <p>{results.summary}</p>
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
                                        {results.priorityZones.map((zone, index) => (
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
                               <p className="whitespace-pre-wrap">{results.suggestedActions}</p>
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
