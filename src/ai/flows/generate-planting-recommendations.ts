'use server';

/**
 * @fileOverview A planting recommendation AI agent.
 *
 * - generatePlantingRecommendations - A function that handles the plant recommendation process.
 * - GeneratePlantingRecommendationsInput - The input type for the generatePlantingRecommendations function.
 * - GeneratePlantingRecommendationsOutput - The return type for the generatePlantingRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlantingRecommendationsInputSchema = z.object({
  areaDescription: z
    .string()
    .describe('A description of the area for which planting recommendations are needed.'),
  environmentalConditions: z.string().describe('The environmental conditions of the area, such as climate, soil type, and sunlight exposure.'),
  desiredOutcomes: z.string().describe('The desired outcomes of the planting, such as reducing heat, improving air quality, or increasing biodiversity.'),
});
export type GeneratePlantingRecommendationsInput = z.infer<typeof GeneratePlantingRecommendationsInputSchema>;

const GeneratePlantingRecommendationsOutputSchema = z.object({
  recommendedSpecies: z.array(z.string()).describe('A list of recommended plant species for the area.'),
  plantingStrategy: z.string().describe('A planting strategy for the area, including spacing, layout, and maintenance recommendations.'),
  estimatedImpact: z.string().describe('An estimate of the environmental impact of the planting, such as temperature reduction, air quality improvement, and carbon sequestration.'),
});
export type GeneratePlantingRecommendationsOutput = z.infer<typeof GeneratePlantingRecommendationsOutputSchema>;

export async function generatePlantingRecommendations(input: GeneratePlantingRecommendationsInput): Promise<GeneratePlantingRecommendationsOutput> {
  return generatePlantingRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlantingRecommendationsPrompt',
  input: {schema: GeneratePlantingRecommendationsInputSchema},
  output: {schema: GeneratePlantingRecommendationsOutputSchema},
  prompt: `You are an expert urban planner specializing in planting recommendations.

You will use the provided information about the area, its environmental conditions, and the desired outcomes to generate planting recommendations.

Area Description: {{{areaDescription}}}
Environmental Conditions: {{{environmentalConditions}}}
Desired Outcomes: {{{desiredOutcomes}}}

Consider the following factors when generating your recommendations:

*   Native plant species
*   Adaptation to the local climate
*   Soil type
*   Sunlight exposure
*   Water availability
*   Maintenance requirements

Provide a list of recommended plant species, a planting strategy, and an estimate of the environmental impact of the planting.
`,
});

const generatePlantingRecommendationsFlow = ai.defineFlow(
  {
    name: 'generatePlantingRecommendationsFlow',
    inputSchema: GeneratePlantingRecommendationsInputSchema,
    outputSchema: GeneratePlantingRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
