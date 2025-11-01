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
  municipalityDescription: z.string().min(10, "Please provide a more detailed description."),
  ndviData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "NDVI data file is required."),
  lstData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "LST data file is required."),
  populationDensityData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "Population density data is required."),
  infrastructureData: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).refine(files => files.length > 0, "Infrastructure data is required."),
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
            toast({ title: "Diagnostics Complete", description: "Analysis finished successfully." });
        } else {
            toast({
                variant: "destructive",
                title: "An Error Occurred",
                description: response.error || "Failed to run diagnostics.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Automated Diagnostics</CardTitle>
                        <CardDescription>Upload geospatial data to identify urban heat islands and priority zones for green intervention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="municipalityDescription">Municipality Description</Label>
                                <Textarea id="municipalityDescription" {...form.register('municipalityDescription')} placeholder="e.g., Juquitiba/SP, a small city with surrounding Atlantic Forest..." />
                                {form.formState.errors.municipalityDescription && <p className="text-sm text-destructive">{form.formState.errors.municipalityDescription.message}</p>}
                            </div>
                            <FileInput label="Vegetation Cover (NDVI)" name="ndviData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Land Surface Temp. (LST)" name="lstData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Population Density" name="populationDensityData" register={form.register} errors={form.formState.errors} />
                            <FileInput label="Critical Infrastructure" name="infrastructureData" register={form.register} errors={form.formState.errors} />
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Analyzing..." : "Run Diagnostics"}
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
                            <p className="text-muted-foreground">Analyzing geospatial data... This may take a moment.</p>
                        </div>
                    </Card>
                )}
                {results ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Diagnostics Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{results.summary}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Priority Zones</CardTitle>
                                <CardDescription>Top locations where green intervention is most needed.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MapPlaceholder />
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Heat Risk</TableHead>
                                            <TableHead>Social Vulnerability</TableHead>
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
                                <CardTitle>Suggested Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="whitespace-pre-wrap">{results.suggestedActions}</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p>Your analysis results will appear here.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
