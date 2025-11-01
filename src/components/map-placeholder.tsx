import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const mapImage = PlaceHolderImages.find((img) => img.id === 'map-placeholder-1');

export default function MapPlaceholder() {
  return (
    <Card>
      <CardContent className="p-0 relative aspect-video">
        {mapImage && (
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            data-ai-hint={mapImage.imageHint}
            fill
            className="object-cover rounded-lg"
          />
        )}
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center p-4 rounded-lg">
          <div className="text-center bg-background/80 p-4 rounded-md shadow-lg">
            <h3 className="font-semibold text-foreground">Mapa Interativo</h3>
            <p className="text-sm text-muted-foreground">
              Para habilitar mapas interativos, adicione sua chave de API do Google Maps
              às suas variáveis de ambiente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
