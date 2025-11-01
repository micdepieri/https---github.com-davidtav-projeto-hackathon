
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
import { z } from 'zod';

// Helper to convert file to data URI
async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

const diagnoseSchema = z.object({
  municipalityDescription: z
    .string()
    .min(1, 'A descrição do município é obrigatória.'),
  ndviData: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'O arquivo de dados NDVI é obrigatório.'),
  lstData: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'O arquivo de dados LST é obrigatório.'),
  populationDensityData: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'O arquivo de dados de densidade populacional é obrigatório.'),
  infrastructureData: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'O arquivo de dados de infraestrutura é obrigatório.'),
});

export async function runDiagnostics(
  formData: FormData
): Promise<{
  success: boolean;
  data?: DiagnoseUrbanHeatIslandsOutput;
  error?: string;
}> {
  const parsed = diagnoseSchema.safeParse({
    municipalityDescription: formData.get('municipalityDescription'),
    ndviData: formData.get('ndviData'),
    lstData: formData.get('lstData'),
    populationDensityData: formData.get('populationDensityData'),
    infrastructureData: formData.get('infrastructureData'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    const input: DiagnoseUrbanHeatIslandsInput = {
      municipalityDescription: parsed.data.municipalityDescription,
      ndviDataUri: await fileToDataURI(parsed.data.ndviData),
      lstDataUri: await fileToDataURI(parsed.data.lstData),
      populationDensityData: await fileToDataURI(
        parsed.data.populationDensityData
      ),
      infrastructureData: await fileToDataURI(parsed.data.infrastructureData),
    };

    const result = await diagnoseUrbanHeatIslands(input);
    return { success: true, data: result };
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
