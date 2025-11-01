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
  areaDescription: z.string().min(10, "Please provide a more detailed description of the area."),
  environmentalConditions: z.string().min(10, "Please describe the environmental conditions."),
  desiredOutcomes: z.string().min(10, "Please describe the desired outcomes."),
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
            toast({ title: "Recommendations Generated", description: "Your planting plan is ready." });
        } else {
            toast({
                variant: "destructive",
                title: "An Error Occurred",
                description: response.error || "Failed to generate recommendations.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Smart Recommendations</CardTitle>
                        <CardDescription>Generate intelligent planting recommendations based on your specific needs and local conditions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="areaDescription">Area Description</Label>
                                <Textarea id="areaDescription" {...form.register('areaDescription')} placeholder="e.g., A dense urban block with mostly concrete surfaces in Jardim São José..." />
                                {form.formState.errors.areaDescription && <p className="text-sm text-destructive">{form.formState.errors.areaDescription.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="environmentalConditions">Environmental Conditions</Label>
                                <Textarea id="environmentalConditions" {...form.register('environmentalConditions')} placeholder="e.g., Full sun exposure, clay soil, moderate seasonal rainfall..." />
                                {form.formState.errors.environmentalConditions && <p className="text-sm text-destructive">{form.formState.errors.environmentalConditions.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desiredOutcomes">Desired Outcomes</Label>
                                <Textarea id="desiredOutcomes" {...form.register('desiredOutcomes')} placeholder="e.g., Reduce peak summer temperature, increase biodiversity, create a pedestrian-friendly shaded area..." />
                                {form.formState.errors.desiredOutcomes && <p className="text-sm text-destructive">{form.formState.errors.desiredOutcomes.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Generating..." : "Get Recommendations"}
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
                            <p className="text-muted-foreground">Correlating variables and selecting species...</p>
                        </div>
                    </Card>
                )}
                {results ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recommended Species</CardTitle>
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
                                <CardTitle>Planting Strategy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{results.plantingStrategy}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Estimated Impact</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <p className="whitespace-pre-wrap">{results.estimatedImpact}</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground">
                            <p>Your planting recommendations will appear here.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
