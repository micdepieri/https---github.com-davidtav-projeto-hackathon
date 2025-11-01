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
            <h3 className="font-semibold text-foreground">Interactive Map</h3>
            <p className="text-sm text-muted-foreground">
              To enable interactive maps, please add your Google Maps API key to
              your environment variables.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
