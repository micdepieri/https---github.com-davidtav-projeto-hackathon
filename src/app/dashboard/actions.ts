
'use server';

import {
  diagnoseUrbanHeatIslands,
  type DiagnoseUrbanHeatIslandsInput,
  type DiagnoseUrbanHeatIslandsOutput,
} from '@/ai/flows/diagnose-urban-heat-islands';
import {
  generatePlantingRecommendations,
  type GeneratePlantingRecommendationsInput,
  type GeneratePlantingRecommendationsOutput,
} from '@/ai/flows/generate-planting-recommendations';
import {
  generateClimatePlan,
  type GenerateClimatePlanInput,
  type GenerateClimatePlanOutput,
} from '@/ai/flows/generate-climate-plan';
import {
    getUrbanHeatIslandData,
} from '@/ai/flows/get-urban-heat-island-data';
import { z } from 'zod';
import { addDoc, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';


const diagnoseSchema = z.object({
  municipalityDescription: z
    .string()
    .min(1, 'A descrição do município é obrigatória.'),
  municipalityName: z.string().min(1, 'O nome do município é obrigatório.'),
});

export async function runDiagnostics(
  formData: FormData
): Promise<{
  success: boolean;
  data?: {
    output: DiagnoseUrbanHeatIslandsOutput;
    input: DiagnoseUrbanHeatIslandsInput;
  };
  error?: string;
}> {
  const parsed = diagnoseSchema.safeParse({
    municipalityDescription: formData.get('municipalityDescription'),
    municipalityName: formData.get('municipalityName'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    // Step 1: Get data from Earth Engine flow
    console.log(`Getting Earth Engine data for ${parsed.data.municipalityName}`);
    const earthEngineData = await getUrbanHeatIslandData({ municipalityName: parsed.data.municipalityName });
    console.log('Successfully got Earth Engine data');

    // Step 2: Pass the data to the diagnostics flow
    const diagnosticsInput: DiagnoseUrbanHeatIslandsInput = {
      municipalityDescription: parsed.data.municipalityDescription,
      ndviDataUri: earthEngineData.ndviDataUri,
      lstDataUri: earthEngineData.lstDataUri,
      populationDensityData: earthEngineData.populationDensityData,
      infrastructureData: earthEngineData.infrastructureData,
    };

    console.log('Running diagnostics flow');
    const result = await diagnoseUrbanHeatIslands(diagnosticsInput);
    console.log('Successfully ran diagnostics flow');
    return { success: true, data: { output: result, input: diagnosticsInput } };
  } catch (error: any) {
    console.error("Detailed error in runDiagnostics:", error);
    const errorMessage = error.message || 'Ocorreu um erro durante o diagnóstico.';
    return { success: false, error: errorMessage };
  }
}

export async function runRecommendations(
  input: GeneratePlantingRecommendationsInput
): Promise<{
  success: boolean;
  data?: GeneratePlantingRecommendationsOutput;
  error?: string;
}> {
  try {
    const result = await generatePlantingRecommendations(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'Falha ao gerar recomendações' };
  }
}

export async function runPlanGeneration(
  input: GenerateClimatePlanInput
): Promise<{
  success: boolean;
  data?: GenerateClimatePlanOutput;
  error?: string;
}> {
  try {
    const result = await generateClimatePlan(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'Falha ao gerar o plano' };
  }
}

const addCitySchema = z.object({
  cityName: z.string().min(3, 'O nome da cidade é obrigatório.'),
});

export async function addCity(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = addCitySchema.safeParse({
    cityName: formData.get('cityName'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, 'cities'), {
      name: parsed.data.cityName,
    });
    return { success: true };
  } catch (e: any) {
    console.error('Failed to add city:', e);
    return { success: false, error: e.message || 'Falha ao adicionar cidade.' };
  }
}

const initialCities = [
    // Capitais
    'Aracaju', 'Belém', 'Belo Horizonte', 'Boa Vista', 'Brasília', 'Campo Grande',
    'Cuiabá', 'Florianópolis', 'Fortaleza', 'Goiânia', 'João Pessoa',
    'Macapá', 'Maceió', 'Manaus', 'Natal', 'Palmas', 'Porto Alegre',
    'Porto Velho', 'Recife', 'Rio Branco', 'Rio de Janeiro', 'Salvador',
    'São Luís', 'São Paulo', 'Teresina', 'Vitória',
    // Cidades do PR
    'Curitiba', 'São José dos Pinhais', 'Araucária', 'Fazenda Rio Grande'
];

export async function seedInitialCities(): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const citiesRef = collection(firestore, 'cities');
        const snapshot = await getDocs(citiesRef);

        if (!snapshot.empty) {
            console.log('Cities collection already populated.');
            return { success: true, error: 'Cities collection already populated.' };
        }

        const batch = writeBatch(firestore);
        initialCities.forEach(name => {
            const docRef = doc(citiesRef); // Create a new doc reference
            batch.set(docRef, { name });
        });

        await batch.commit();
        console.log('Successfully seeded cities collection.');
        return { success: true };
    } catch (e: any) {
        console.error('Failed to seed cities:', e);
        return { success: false, error: e.message || 'Failed to seed initial cities.' };
    }
}
