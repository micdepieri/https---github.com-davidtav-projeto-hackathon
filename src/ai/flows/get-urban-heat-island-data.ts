
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
    const privateKey = process.env.EE_PRIVATE_KEY!.replace(/\\n/g, '\n');
    const clientEmail = process.env.EE_CLIENT_EMAIL;

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/cloud-platform'],
    });

    return new Promise((resolve, reject) => {
        auth.authorize((err) => {
            if (err) {
                console.error('Authentication error:', err);
                return reject(err);
            }
            ee.initialize(null, null, resolve, reject, null, auth);
        });
    });
}

// Helper function to get image URI from Earth Engine
function getEeImageUri(image: ee.Image<ee.Dictionary<any>>): Promise<string> {
    return new Promise((resolve, reject) => {
        image.getThumbURL({ format: 'png' }, (url, err) => {
            if (err) {
                console.error("Error getting image URL from EE:", err);
                return reject(new Error(err));
            }
            if (!url) {
                console.error("No URL returned from EE");
                return reject(new Error('No URL returned from Earth Engine. The region may be too large or the processing may have failed.'));
            }
            resolve(url);
        });
    });
}

// Helper function to fetch the image and convert to data URI
async function fetchImageAndConvertToDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch image from URL: ${url}`, `Status: ${response.status}`, `Body: ${errorText}`);
        throw new Error(`Failed to fetch image data from Google Earth Engine. Status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/png;base64,${buffer.toString('base64')}`;
}


export async function getUrbanHeatIslandData(input: GetUrbanHeatIslandDataInput): Promise<GetUrbanHeatIslandDataOutput> {
    console.log(`Fetching real Earth Engine data for: ${input.municipalityName}`);
    
    await initializeEE();
    console.log('Google Earth Engine initialized successfully.');

    // 1. Get the geometry for the municipality
    const brMunicipalities = ee.FeatureCollection('projects/ee-mateusbatista/assets/Brasil_Mun');
    const geometry = brMunicipalities.filter(ee.Filter.eq('NM_MUN', input.municipalityName)).first().geometry();

    // 2. Get Landsat 9 data for the period, filter by geometry and cloud cover
    const landsat = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterBounds(geometry)
        .filterDate('2023-01-01', '2023-12-31')
        .filter(ee.Filter.lt('CLOUD_COVER', 20));

    const medianImage = landsat.median().clip(geometry);

    // 3. Calculate NDVI
    const nir = medianImage.select('SR_B5');
    const red = medianImage.select('SR_B4');
    const ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
    const ndviVis = { min: -0.2, max: 0.8, palette: ['blue', 'white', 'green'] };
    const ndviImage = ndvi.visualize(ndviVis);

    // 4. Calculate LST
    const thermal = medianImage.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15); // to Celsius
    const lstVis = { min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'red'] };
    const lstImage = thermal.visualize(lstVis);
    
    // 5. Population Density
    const population = ee.ImageCollection("WorldPop/GP/100m/pop").filterDate('2020-01-01', '2020-12-31').mosaic().clip(geometry);
    const populationVis = {min: 0, max: 1000, palette: ['white', 'yellow', 'orange', 'red']};
    const populationImage = population.visualize(populationVis);
    
    // 6. Critical Infrastructure (example: hospitals and schools from OpenStreetMap)
    const hospitals = ee.FeatureCollection("projects/ee-mateusbatista/assets/hospitais_brasil_osm_2024").filterBounds(geometry);
    const schools = ee.FeatureCollection("projects/ee-mateusbatista/assets/escolas_brasil_osm_2024").filterBounds(geometry);
    
    const empty = ee.Image().byte();
    const hospitalImage = empty.paint({featureCollection: hospitals, color: 1, width: 2});
    const schoolImage = empty.paint({featureCollection: schools, color: 1, width: 2});

    const infrastructureImage = hospitalImage.add(schoolImage).selfMask().visualize({palette: 'purple'});

    // 7. Get image URIs and convert to data URIs
    const [ndviUrl, lstUrl, popUrl, infraUrl] = await Promise.all([
        getEeImageUri(ndviImage),
        getEeImageUri(lstImage),
        getEeImageUri(populationImage),
        getEeImageUri(infrastructureImage),
    ]);
    
    const [ndviDataUri, lstDataUri, populationDensityData, infrastructureData] = await Promise.all([
        fetchImageAndConvertToDataUri(ndviUrl),
        fetchImageAndConvertToDataUri(lstUrl),
        fetchImageAndConvertToDataUri(popUrl),
        fetchImageAndConvertToDataUri(infraUrl),
    ]);
    
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
