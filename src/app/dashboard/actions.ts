
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
    const earthEngineData = await getUrbanHeatIslandData({ municipalityName: parsed.data.municipalityName });

    // Step 2: Pass the data to the diagnostics flow
    const diagnosticsInput: DiagnoseUrbanHeatIslandsInput = {
      municipalityDescription: parsed.data.municipalityDescription,
      ndviDataUri: earthEngineData.ndviDataUri,
      lstDataUri: earthEngineData.lstDataUri,
      populationDensityData: earthEngineData.populationDensityData,
      infrastructureData: earthEngineData.infrastructureData,
    };

    const result = await diagnoseUrbanHeatIslands(diagnosticsInput);
    return { success: true, data: { output: result, input: diagnosticsInput } };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ocorreu um erro durante o diagnóstico.' };
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
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Falha ao gerar recomendações' };
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
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Falha ao gerar o plano' };
  }
}
