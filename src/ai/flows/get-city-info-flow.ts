'use server';

/**
 * @fileOverview A flow for fetching city information from IBGE and generating a description using AI.
 *
 * - getCityInfo - Fetches city data and generates a description.
 * - GetCityInfoInput - The input type for the getCityInfo function.
 * - GetCityInfoOutput - The return type for the getCityInfo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetCityInfoInputSchema = z.object({
  municipalityName: z.string().describe('The name of the municipality to fetch data for.'),
});
export type GetCityInfoInput = z.infer<typeof GetCityInfoInputSchema>;

const GetCityInfoOutputSchema = z.object({
  description: z.string().describe('A generated description of the city based on IBGE data.'),
});
export type GetCityInfoOutput = z.infer<typeof GetCityInfoOutputSchema>;


async function getIbgeData(municipalityName: string): Promise<any> {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipalityName}`);
    if (!response.ok) {
        // Try to search if the exact name is not found
        const searchResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`);
        const allCities = await searchResponse.json();
        const city = allCities.find((c: any) => c.nome.toLowerCase() === municipalityName.toLowerCase());
        if (city) {
            const cityDetailsResponse = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${city.id}`);
             if (!cityDetailsResponse.ok) throw new Error(`Failed to fetch city data from IBGE for ${municipalityName}`);
             return cityDetailsResponse.json();
        }
       throw new Error(`Failed to fetch city data from IBGE for ${municipalityName}`);
    }
    return response.json();
}

async function getCityPopulation(cityId: string): Promise<any> {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324?localidades=N6[${cityId}]`);
     if (!response.ok) return { "estimativa": "não disponível" };
    const data = await response.json();
    return data[0]?.resultados[0]?.series[0]?.serie || { "2022": "não disponível" };
}

async function getCityArea(cityId: string): Promise<any> {
     const response = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/1301/periodos/2022/variaveis/615?localidades=N6[${cityId}]`);
     if (!response.ok) return { "valor": "não disponível" };
     const data = await response.json();
     return data[0]?.resultados[0]?.series[0]?.serie || { "2022": "não disponível" };
}


const prompt = ai.definePrompt({
    name: 'generateCityDescriptionPrompt',
    input: { schema: z.any() },
    output: { schema: GetCityInfoOutputSchema },
    prompt: `You are an expert urban planner assistant. Based on the following data from IBGE for a Brazilian municipality, generate a concise and informative description (in Portuguese) suitable for a climate planning context. 
    Focus on key aspects like location, biome, population, and area. Keep it to 2-3 sentences.

    IBGE Data:
    - Nome: {{{name}}}
    - Microrregião: {{{microrregiao.nome}}}
    - Mesorregião: {{{microrregiao.mesorregiao.nome}}}
    - UF: {{{microrregiao.mesorregiao.UF.sigla}}}
    - Bioma: {{{microrregiao.mesorregiao.UF.regiao.nome}}} (Note: This is the broader region's biome, adapt if more specific info is known)
    - População (Estimativa 2022): {{{population}}}
    - Área Territorial (km²): {{{area}}}
    
    Generate the description now.`,
});


const getCityInfoFlow = ai.defineFlow(
  {
    name: 'getCityInfoFlow',
    inputSchema: GetCityInfoInputSchema,
    outputSchema: GetCityInfoOutputSchema,
  },
  async ({ municipalityName }) => {
    // IBGE API uses city name without state. Let's extract it.
    const cityNameOnly = municipalityName.split(' - ')[0];

    const ibgeData = await getIbgeData(cityNameOnly);
    const populationData = await getCityPopulation(ibgeData.id);
    const areaData = await getCityArea(ibgeData.id);

    const fullData = {
        ...ibgeData,
        population: populationData['2022'],
        area: areaData['2022']
    };
    
    const { output } = await prompt(fullData);
    return output!;
  }
);


export async function getCityInfo(input: GetCityInfoInput): Promise<GetCityInfoOutput> {
  return getCityInfoFlow(input);
}