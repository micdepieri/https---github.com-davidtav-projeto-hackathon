
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { getCityMap } from '@/app/dashboard/actions';
import { useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin } from 'lucide-react';

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
    const [mapUrl, setMapUrl] = useState<string | null>(null);
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

    const handleShowMap = async () => {
        if (!city?.name) {
            toast({
                variant: "destructive",
                title: "Cidade não encontrada",
                description: "O seu usuário não está vinculado a uma cidade. Por favor, entre em contato com o administrador.",
            });
            return;
        }

        setIsLoading(true);
        setMapUrl(null);
        
        const response = await getCityMap(city.name);

        if (response.success && response.mapUrl) {
            setMapUrl(response.mapUrl);
            toast({ title: "Mapa Carregado", description: `Visualizando mapa de ${city.name}` });
        } else {
            toast({
                variant: "destructive",
                title: "Ocorreu um Erro",
                description: response.error || "Falha ao carregar o mapa.",
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
                        <CardTitle>Visualizador de Mapa</CardTitle>
                        {isLoadingData ? (
                             <CardDescription>Carregando dados da cidade...</CardDescription>
                        ) : city ? (
                             <CardDescription>
                                Visualize o mapa de satélite para <strong>{city.name}</strong>.
                            </CardDescription>
                        ) : (
                             <CardDescription>Vincule seu usuário a uma cidade para visualizar o mapa.</CardDescription>
                        )}
                       
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleShowMap} disabled={isLoading || isLoadingData || !city} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Carregando Mapa..." : "Visualizar Mapa"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                {isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground">Buscando imagem de satélite... Isso pode levar um momento.</p>
                        </div>
                    </Card>
                )}
                {mapUrl ? (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mapa de Satélite</CardTitle>
                                <CardDescription>{city?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Image src={mapUrl} alt={`Mapa de ${city?.name}`} width={800} height={600} className="rounded-md border object-cover" />
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoading && (
                    <Card className="flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center text-muted-foreground flex flex-col items-center gap-4">
                            <MapPin className="h-12 w-12" />
                            <p>O mapa da sua cidade aparecerá aqui.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
