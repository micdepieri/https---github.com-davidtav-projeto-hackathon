
'use server';

/**
 * @fileOverview A flow for fetching urban heat island data from Google Earth Engine.
 *
 * - getUrbanHeatIslandData - A function that fetches urban heat island data.
 * - GetUrbanHeatIslandDataInput - The input type for the getUrbanheatIslandData function.
 * - GetUrbanHeatIslandDataOutput - The return type for the getUrbanHeatIslandData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import ee from '@google/earthengine';
import { google } from 'googleapis';

const GetUrbanHeatIslandDataInputSchema = z.object({
  municipalityName: z.string().describe('The name of the municipality to fetch data for.'),
});

export type GetUrbanHeatIslandDataInput = z.infer<typeof GetUrbanHeatIslandDataInputSchema>;

const GetUrbanHeatIslandDataOutputSchema = z.object({
  ndviDataUri: z
    .string()
    .describe('Vegetation cover data as a data URI (NDVI).'),
  lstDataUri: z
    .string()
    .describe('Land surface temperature data as a data URI (LST).'),
  populationDensityData: z.string().describe('Population density data as a data URI.'),
  infrastructureData: z.string().describe('Proximity to critical infrastructure data as a data URI.'),
});

export type GetUrbanHeatIslandDataOutput = z.infer<typeof GetUrbanHeatIslandDataOutputSchema>;

async function initializeEE() {
    console.log("Attempting to initialize Earth Engine...");
    const privateKey = process.env.NEXT_PUBLIC_EE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.NEXT_PUBLIC_EE_CLIENT_EMAIL;
    
    if (!privateKey || !clientEmail) {
        throw new Error("NEXT_PUBLIC_EE_PRIVATE_KEY or NEXT_PUBLIC_EE_CLIENT_EMAIL environment variables are not set.");
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/cloud-platform'],
    });
    
    console.log("JWT auth object created. Authorizing...");

    return new Promise<void>((resolve, reject) => {
        auth.authorize((err) => {
            if (err) {
                console.error('Earth Engine authorization error:', err);
                return reject(new Error('Failed to authorize with Google Earth Engine.'));
            }
            console.log("Authorization successful. Initializing Earth Engine API...");
            ee.initialize(auth, null, () => {
                console.log("Earth Engine API initialized successfully.");
                resolve();
            }, (err: any) => {
                 console.error('Earth Engine initialization error:', err);
                 reject(new Error(`Failed to initialize Earth Engine API: ${err}`));
            });
        });
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


export async function getUrbanHeatIslandData(input: GetUrbanHeatIslandDataInput): Promise<GetUrbanHeatIslandDataOutput> {
    console.log(`Fetching real Earth Engine data for: ${input.municipalityName}`);
    
    await initializeEE();

    // 1. Get the geometry for the municipality
    console.log("Fetching municipality geometry...");
    const brMunicipalities = ee.FeatureCollection('projects/ee-mateusbatista/assets/Brasil_Mun');
    const municipalityFeature = brMunicipalities.filter(ee.Filter.eq('NM_MUN', input.municipalityName)).first();
    const geometry = municipalityFeature.geometry();
    console.log("Municipality geometry obtained.");

    // 2. Get Landsat 9 data for the period, filter by geometry and cloud cover
    console.log("Fetching Landsat 9 data...");
    const landsat = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterBounds(geometry)
        .filterDate('2023-01-01', '2023-12-31')
        .filter(ee.Filter.lt('CLOUD_COVER', 20));

    const medianImage = landsat.median().clip(geometry);
    console.log("Landsat 9 data processed.");

    // 3. Calculate NDVI
    console.log("Calculating NDVI...");
    const nir = medianImage.select('SR_B5');
    const red = medianImage.select('SR_B4');
    const ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
    const ndviVis = { min: -0.2, max: 0.8, palette: ['blue', 'white', 'green'] };
    const ndviImage = ndvi.visualize(ndviVis);
    console.log("NDVI calculated.");

    // 4. Calculate LST
    console.log("Calculating LST...");
    const thermal = medianImage.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15); // to Celsius
    const lstVis = { min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'red'] };
    const lstImage = thermal.visualize(lstVis);
    console.log("LST calculated.");
    
    // 5. Population Density
    console.log("Fetching Population Density data...");
    const population = ee.ImageCollection("WorldPop/GP/100m/pop").filterDate('2020-01-01', '2020-12-31').mosaic().clip(geometry);
    const populationVis = {min: 0, max: 1000, palette: ['white', 'yellow', 'orange', 'red']};
    const populationImage = population.visualize(populationVis);
    console.log("Population Density data processed.");
    
    // 6. Critical Infrastructure (example: hospitals and schools from OpenStreetMap)
    console.log("Fetching Critical Infrastructure data...");
    const hospitals = ee.FeatureCollection("projects/ee-mateusbatista/assets/hospitais_brasil_osm_2024").filterBounds(geometry);
    const schools = ee.FeatureCollection("projects/ee-mateusbatista/assets/escolas_brasil_osm_2024").filterBounds(geometry);
    
    const empty = ee.Image().byte();
    const hospitalImage = empty.paint({featureCollection: hospitals, color: 1, width: 2});
    const schoolImage = empty.paint({featureCollection: schools, color: 1, width: 2});

    const infrastructureImage = hospitalImage.add(schoolImage).selfMask().visualize({palette: 'purple'});
    console.log("Critical Infrastructure data processed.");

    // 7. Get image URIs and convert to data URIs
    console.log("Generating and fetching all image URIs...");
    const [ndviUrl, lstUrl, popUrl, infraUrl] = await Promise.all([
        getEeImageUri(ndviImage, "NDVI"),
        getEeImageUri(lstImage, "LST"),
        getEeImageUri(populationImage, "Population"),
        getEeImageUri(infrastructureImage, "Infrastructure"),
    ]);
    
    const [ndviDataUri, lstDataUri, populationDensityData, infrastructureData] = await Promise.all([
        fetchImageAndConvertToDataUri(ndviUrl, "NDVI"),
        fetchImageAndConvertToDataUri(lstUrl, "LST"),
        fetchImageAndConvertToDataUri(popUrl, "Population"),
        fetchImageAndConvertToDataUri(infraUrl, "Infrastructure"),
    ]);
    
    console.log("All data URIs created successfully. Returning data.");
    return {
        ndviDataUri,
        lstDataUri,
        populationDensityData,
        infrastructureData
    };
}

const getUrbanHeatIslandDataFlow = ai.defineFlow(
  {
    name: 'getUrbanHeatIslandDataFlow',
    inputSchema: GetUrbanHeatIslandDataInputSchema,
    outputSchema: GetUrbanHeatIslandDataOutputSchema,
  },
  getUrbanHeatIslandData
);
