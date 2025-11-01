
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { addCity, getCityByCep } from '@/app/dashboard/actions';
import { useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from 'lucide-react';

const cepFormSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, "Por favor, insira um CEP válido com 8 dígitos."),
});

type CepFormValues = z.infer<typeof cepFormSchema>;

interface City {
    id: string;
    name: string;
}

interface UserProfile {
    roles?: string[];
}

interface ViaCepResponse {
    localidade: string;
    uf: string;
    erro?: boolean;
}

export default function CitiesPage() {
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [isAddingCity, setIsAddingCity] = useState(false);
    const [foundCity, setFoundCity] = useState<ViaCepResponse | null>(null);
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    const router = useRouter();

    const userProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!userLoading && !profileLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            const isAdmin = userProfile?.roles?.includes('admin');
            if (!isAdmin) {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, userLoading, profileLoading, router, toast]);

    const citiesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'cities'));
    }, [firestore]);
    
    const { data: cities, loading: citiesLoading } = useCollection<City>(citiesQuery);

    const cepForm = useForm<CepFormValues>({
        resolver: zodResolver(cepFormSchema),
        defaultValues: {
            cep: "",
        }
    });

    const handleSearchCep = async ({ cep }: CepFormValues) => {
        setIsSearchingCep(true);
        setFoundCity(null);
        const response = await getCityByCep(cep);
        if (response.success && response.data) {
            if (response.data.erro) {
                toast({ variant: 'destructive', title: 'CEP não encontrado' });
            } else {
                setFoundCity(response.data);
            }
        } else {
            toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: response.error });
        }
        setIsSearchingCep(false);
    };

    const handleAddCity = async () => {
        if (!foundCity) return;
        
        setIsAddingCity(true);
        const cityName = `${foundCity.localidade} - ${foundCity.uf}`;
        
        const formData = new FormData();
        formData.append('cityName', cityName);

        const response = await addCity(formData);

        if (response.success) {
            toast({ title: "Cidade Adicionada", description: `${cityName} foi adicionada com sucesso.` });
            cepForm.reset();
            setFoundCity(null);
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao adicionar a cidade.",
            });
        }
        setIsAddingCity(false);
    };

    const pageIsLoading = userLoading || profileLoading;
    const isAdmin = userProfile?.roles?.includes('admin');

    if (pageIsLoading || !isAdmin) {
        return (
            <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Nova Cidade</CardTitle>
                        <CardDescription>Cadastre uma nova cidade no sistema usando o CEP.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={cepForm.handleSubmit(handleSearchCep)} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cep">CEP</Label>
                                <div className="flex gap-2">
                                <Input id="cep" {...cepForm.register('cep')} placeholder="Ex: 01001000" />
                                <Button type="submit" size="icon" variant="outline" disabled={isSearchingCep}>
                                    {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                                </div>
                                {cepForm.formState.errors.cep && <p className="text-sm text-destructive">{cepForm.formState.errors.cep.message}</p>}
                            </div>
                        </form>
                        {foundCity && (
                             <div className="mt-4 grid gap-4 rounded-md border bg-muted/50 p-4">
                                <p className="text-sm">Cidade encontrada:</p>
                                <p className="text-lg font-semibold">{foundCity.localidade} - {foundCity.uf}</p>
                                <Button onClick={handleAddCity} disabled={isAddingCity}>
                                    {isAddingCity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Adicionar Cidade
                                </Button>
                            </div>
                        )}
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
