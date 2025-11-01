
'use server';

/**
 * @fileOverview A flow for fetching a satellite map of a city from Google Earth Engine.
 *
 * - getCityMap - A function that fetches the map.
 * - GetCityMapInput - The input type for the getCityMap function.
 * - GetCityMapOutput - The return type for the getCityMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import ee from '@google/earthengine';

const GetCityMapInputSchema = z.object({
  municipalityName: z.string().describe('The name of the municipality to fetch data for.'),
});

export type GetCityMapInput = z.infer<typeof GetCityMapInputSchema>;

const GetCityMapOutputSchema = z.object({
  mapDataUri: z
    .string()
    .describe('Satellite map data as a data URI.'),
});

export type GetCityMapOutput = z.infer<typeof GetCityMapOutputSchema>;

function initializeEE(): Promise<void> {
    const privateKey = process.env.NEXT_PUBLIC_EE_PRIVATE_KEY;
    const clientEmail = process.env.NEXT_PUBLIC_EE_CLIENT_EMAIL;
    const project = process.env.NEXT_PUBLIC_EE_PROJECT_ID;

    if (!privateKey || !clientEmail || !project) {
        throw new Error("Google Earth Engine environment variables (private key, client email, project ID) are not set.");
    }
    
    console.log("Attempting to authenticate with Earth Engine...");

    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            {client_email: clientEmail, private_key: privateKey},
            () => {
                console.log("Earth Engine authentication successful.");
                ee.initialize(null, null, () => {
                    console.log("Earth Engine API initialized successfully.");
                    resolve();
                }, (err: string | undefined) => {
                    console.error("Earth Engine initialization error:", err);
                    reject(new Error(`Failed to initialize Earth Engine API: ${err}`));
                });
            },
            (err: string | undefined) => {
                console.error("Earth Engine authentication failed:", err);
                reject(new Error(`Failed to authenticate with Earth Engine: ${err}`));
            }
        );
    });
}

// Helper function to get image URI from Earth Engine
function getEeImageUri(image: ee.Image<ee.Dictionary<any>>, imageName: string): Promise<string> {
    console.log(`Requesting ThumbURL for: ${imageName}`);
    return new Promise((resolve, reject) => {
        image.getThumbURL({ format: 'png' }, (url, err) => {
            if (err) {
                console.error(`Error getting ThumbURL for ${imageName}:`, err);
                return reject(new Error(`Failed to get image URL for ${imageName} from Earth Engine: ${err}`));
            }
            if (!url) {
                console.error(`No URL returned for ${imageName}.`);
                return reject(new Error(`No URL returned for ${imageName}. The region may be too large or the processing may have failed.`));
            }
            console.log(`Successfully got ThumbURL for: ${imageName}`);
            resolve(url);
        });
    });
}

// Helper function to fetch the image and convert to data URI
async function fetchImageAndConvertToDataUri(url: string, imageName: string): Promise<string> {
    console.log(`Fetching image data for: ${imageName}`);
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch image for ${imageName}. Status: ${response.status}`, `Body: ${errorText}`);
        throw new Error(`Failed to fetch image data for ${imageName} from Google Earth Engine. Status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Successfully fetched and encoded image for: ${imageName}`);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}


export async function getCityMap(input: GetCityMapInput): Promise<GetCityMapOutput> {
    console.log(`Fetching satellite map for: ${input.municipalityName}`);
    
    await initializeEE();

    // 1. Get the geometry for the municipality
    console.log("Fetching municipality geometry...");
    const brMunicipalities = ee.FeatureCollection('projects/ee-mateusbatista/assets/Brasil_Mun');
    const municipalityFeature = brMunicipalities.filter(ee.Filter.eq('NM_MUN', input.municipalityName)).first();
    const geometry = municipalityFeature.geometry();
    console.log("Municipality geometry obtained.");

    // 2. Get Sentinel-2 data for a clear image
    console.log("Fetching Sentinel-2 data...");
    const s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(geometry)
        .filterDate('2023-01-01', '2023-12-31')
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));

    const medianImage = s2.median().clip(geometry);
    console.log("Sentinel-2 data processed.");
    
    // 3. Visualize the image in true color
    const visParams = { bands: ['B4', 'B3', 'B2'], min: 0, max: 3000 };
    const satelliteImage = medianImage.visualize(visParams);

    // 4. Get image URI and convert to data URI
    console.log("Generating and fetching satellite image URI...");
    const mapUrl = await getEeImageUri(satelliteImage, "SatelliteMap");
    const mapDataUri = await fetchImageAndConvertToDataUri(mapUrl, "SatelliteMap");
    
    console.log("Satellite map created successfully. Returning data.");
    return {
        mapDataUri,
    };
}

const getCityMapFlow = ai.defineFlow(
  {
    name: 'getCityMapFlow',
    inputSchema: GetCityMapInputSchema,
    outputSchema: GetCityMapOutputSchema,
  },
  getCityMap
);
