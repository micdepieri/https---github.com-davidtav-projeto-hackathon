
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { addCity } from '@/app/dashboard/actions';
import { useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  cityName: z.string().min(3, "Por favor, insira o nome da cidade."),
});

type FormValues = z.infer<typeof formSchema>;

interface City {
    id: string;
    name: string;
}

export default function CitiesPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const citiesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'cities'));
    }, [firestore]);
    
    const { data: cities, loading: citiesLoading } = useCollection<City>(citiesQuery);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cityName: "",
        }
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append('cityName', data.cityName);

        const response = await addCity(formData);

        if (response.success) {
            toast({ title: "Cidade Adicionada", description: "A nova cidade foi adicionada com sucesso." });
            form.reset();
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao adicionar a cidade.",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Nova Cidade</CardTitle>
                        <CardDescription>Cadastre uma nova cidade no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="cityName">Nome da Cidade</Label>
                                <Input id="cityName" {...form.register('cityName')} placeholder="Ex: São Paulo" />
                                {form.formState.errors.cityName && <p className="text-sm text-destructive">{form.formState.errors.cityName.message}</p>}
                            </div>
                            
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Adicionando..." : "Adicionar Cidade"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cidades Cadastradas</CardTitle>
                        <CardDescription>Lista de todas as cidades disponíveis no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {citiesLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nome da Cidade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cities && cities.length > 0 ? (
                                        cities.map((city) => (
                                            <TableRow key={city.id}>
                                                <TableCell className="font-mono text-xs">{city.id}</TableCell>
                                                <TableCell className="font-medium">{city.name}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center">Nenhuma cidade cadastrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
