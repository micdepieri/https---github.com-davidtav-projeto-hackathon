'use server';
/**
 * @fileOverview Analyzes urban heat islands and identifies priority areas for green interventions.
 *
 * - diagnoseUrbanHeatIslands - A function that handles the analysis and identification process.
 * - DiagnoseUrbanHeatIslandsInput - The input type for the diagnoseUrbanHeatIslands function.
 * - DiagnoseUrbanHeatIslandsOutput - The return type for the diagnoseUrbanHeatIslands function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseUrbanHeatIslandsInputSchema = z.object({
  ndviDataUri: z
    .string()
    .describe(
      'Vegetation cover data as a data URI (NDVI), including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 'A value close to +1 indicates a high density of green vegetation, and values close to -1 indicate non-vegetated surfaces like barren soil, snow, or water.'
    ),
  lstDataUri: z
    .string()
    .describe(
      'Land surface temperature data as a data URI (LST), including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'. ' + 'Values are in Kelvin.'
    ),
  populationDensityData: z
    .string()
    .describe(
      'Population density data as a data URI, including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'. ' + 'The scale should be in people per square kilometer.'
    ),
  infrastructureData: z
    .string()
    .describe(
      'Proximity to critical infrastructure data as a data URI, including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'. ' + 'This should contain information of schools, hospitals and areas of risk.'
    ),
  municipalityDescription: z.string().describe('A general description of the municipality.'),
});
export type DiagnoseUrbanHeatIslandsInput = z.infer<
  typeof DiagnoseUrbanHeatIslandsInputSchema
>;

const PriorityZoneSchema = z.object({
  location: z.string().describe('The name of the location.'),
  heatRiskLevel: z
    .string()
    .describe(
      'The level of heat risk in the location (high, medium, or low).' + 'High means there is a high surface temperature and low vegetation.'
    ),
  socialVulnerability: z
    .string()
    .describe(
      'The level of social vulnerability in the location (high, medium, or low).' + 'High means there is high population density and proximity to critical infrastructure.'
    ),
  recommendedIntervention: z
    .string()
    .describe(
      'The recommended green intervention for the location. Should mention planting density and suggested species.'
    ),
  estimatedImpact: z
    .string()
    .describe(
      'The estimated impact of the green intervention, including temperature reduction and number of people benefited.'
    ),
});

const DiagnoseUrbanHeatIslandsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of the urban heat island analysis, including the overall heat risk level of the municipality.'
    ),
  priorityZones: z
    .array(PriorityZoneSchema)
    .describe(
      'A list of priority zones for green intervention, sorted by heat risk level (high, medium, low).' + 'The top location is where green intervention is most needed.'
    ),
  suggestedActions: z
    .string()
    .describe(
      'Recommended actions for the city manager to mitigate heat risks and improve community well-being.'
    ),
});
export type DiagnoseUrbanHeatIslandsOutput = z.infer<
  typeof DiagnoseUrbanHeatIslandsOutputSchema
>;

export async function diagnoseUrbanHeatIslands(
  input: DiagnoseUrbanHeatIslandsInput
): Promise<DiagnoseUrbanHeatIslandsOutput> {
  return diagnoseUrbanHeatIslandsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseUrbanHeatIslandsPrompt',
  input: {schema: DiagnoseUrbanHeatIslandsInputSchema},
  output: {schema: DiagnoseUrbanHeatIslandsOutputSchema},
  prompt: `You are an expert in urban heat island analysis and green intervention planning. Your goal is to analyze urban heat islands within a municipality and identify priority areas for green interventions. You will provide a summary of the analysis, a list of priority zones for green intervention, and recommended actions for the city manager to mitigate heat risks and improve community well-being.

Use the following data to perform the analysis:

Municipality Description: {{{municipalityDescription}}}

Vegetation Cover (NDVI): {{media url=ndviDataUri}}

Land Surface Temperature (LST): {{media url=lstDataUri}}

Population Density: {{media url=populationDensityData}}

Proximity to Critical Infrastructure: {{media url=infrastructureData}}

Output should be formatted as JSON with the following keys: summary, priorityZones, suggestedActions.

In the priorityZones field, each zone should include: location, heatRiskLevel, socialVulnerability, recommendedIntervention, and estimatedImpact.

Give detailed intervention suggestions. Consider planting density and suggested species.
`,
});

const diagnoseUrbanHeatIslandsFlow = ai.defineFlow(
  {
    name: 'diagnoseUrbanHeatIslandsFlow',
    inputSchema: DiagnoseUrbanHeatIslandsInputSchema,
    outputSchema: DiagnoseUrbanHeatIslandsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
