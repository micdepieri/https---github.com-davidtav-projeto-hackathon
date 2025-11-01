'use server';

/**
 * @fileOverview Climate plan generation flow.
 *
 * - generateClimatePlan - A function that generates a climate plan for a given municipality.
 * - GenerateClimatePlanInput - The input type for the generateClimatePlan function.
 * - GenerateClimatePlanOutput - The return type for the generateClimatePlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClimatePlanInputSchema = z.object({
  municipalityName: z.string().describe('The name of the municipality.'),
  problemDescription: z.string().describe('The description of the climate related problem.'),
  suggestedAreas: z.string().describe('Suggested areas for green intervention.'),
});

export type GenerateClimatePlanInput = z.infer<typeof GenerateClimatePlanInputSchema>;

const GenerateClimatePlanOutputSchema = z.object({
  climatePlan: z.string().describe('The generated climate plan.'),
  supportingDocumentation: z.string().describe('The supporting documentation for the climate plan.'),
});

export type GenerateClimatePlanOutput = z.infer<typeof GenerateClimatePlanOutputSchema>;

export async function generateClimatePlan(input: GenerateClimatePlanInput): Promise<GenerateClimatePlanOutput> {
  return generateClimatePlanFlow(input);
}

const generateClimatePlanPrompt = ai.definePrompt({
  name: 'generateClimatePlanPrompt',
  input: {schema: GenerateClimatePlanInputSchema},
  output: {schema: GenerateClimatePlanOutputSchema},
  prompt: `You are an expert climate planner. Generate a climate plan for the municipality of {{municipalityName}}.

The problem is: {{problemDescription}}

Suggested areas for green intervention: {{suggestedAreas}}

Include supporting documentation.
`,
});

const generateClimatePlanFlow = ai.defineFlow(
  {
    name: 'generateClimatePlanFlow',
    inputSchema: GenerateClimatePlanInputSchema,
    outputSchema: GenerateClimatePlanOutputSchema,
  },
  async input => {
    const {output} = await generateClimatePlanPrompt(input);
    return output!;
  }
);
