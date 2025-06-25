// use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant services for a service order
 * based on the description of the problem.
 *
 * - suggestRelevantServices - A function that takes a problem description and returns a list of suggested services.
 * - SuggestRelevantServicesInput - The input type for the suggestRelevantServices function.
 * - SuggestRelevantServicesOutput - The output type for the suggestRelevantServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantServicesInputSchema = z.object({
  problemDescription: z
    .string()
    .describe('The description of the problem for which services are needed.'),
});
export type SuggestRelevantServicesInput = z.infer<typeof SuggestRelevantServicesInputSchema>;

const SuggestRelevantServicesOutputSchema = z.object({
  suggestedServices: z
    .array(z.string())
    .describe('A list of suggested services based on the problem description.'),
});
export type SuggestRelevantServicesOutput = z.infer<typeof SuggestRelevantServicesOutputSchema>;

export async function suggestRelevantServices(
  input: SuggestRelevantServicesInput
): Promise<SuggestRelevantServicesOutput> {
  return suggestRelevantServicesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantServicesPrompt',
  input: {schema: SuggestRelevantServicesInputSchema},
  output: {schema: SuggestRelevantServicesOutputSchema},
  prompt: `Você é um especialista em identificar os serviços mais adequados para resolver problemas técnicos. Baseado na descrição do problema fornecida, sugira uma lista de serviços relevantes. Forneça a resposta em português.

Descrição do Problema: {{{problemDescription}}}

Sugestões de Serviços:`,
});

const suggestRelevantServicesFlow = ai.defineFlow(
  {
    name: 'suggestRelevantServicesFlow',
    inputSchema: SuggestRelevantServicesInputSchema,
    outputSchema: SuggestRelevantServicesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
