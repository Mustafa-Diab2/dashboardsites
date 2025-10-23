'use server';

/**
 * @fileOverview A Genkit flow that analyzes task distribution among team members and provides insights.
 *
 * - generateTeamInsights - A function that analyzes task distribution and identifies workload imbalances.
 * - GenerateTeamInsightsInput - The input type for the generateTeamInsights function.
 * - GenerateTeamInsightsOutput - The return type for the generateTeamInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeamInsightsInputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the team member.'),
    total: z.number().describe('The total number of tasks assigned to the member.'),
    backlog: z.number().describe('The number of tasks in the backlog for the member.'),
    in_progress: z.number().describe('The number of tasks in progress for the member.'),
    review: z.number().describe('The number of tasks under review for the member.'),
    done: z.number().describe('The number of tasks completed by the member.'),
  })
).describe('An array of task summaries for each team member.');

export type GenerateTeamInsightsInput = z.infer<typeof GenerateTeamInsightsInputSchema>;

const GenerateTeamInsightsOutputSchema = z.object({
  insights: z.string().describe('Insights and recommendations for task redistribution and process improvements.'),
});

export type GenerateTeamInsightsOutput = z.infer<typeof GenerateTeamInsightsOutputSchema>;

export async function generateTeamInsights(input: GenerateTeamInsightsInput): Promise<GenerateTeamInsightsOutput> {
  return generateTeamInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeamInsightsPrompt',
  input: {schema: GenerateTeamInsightsInputSchema},
  output: {schema: GenerateTeamInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes team task distribution and provides insights for project managers.

  Analyze the following task distribution data and provide actionable recommendations for task redistribution or process improvements.

  Task Distribution:
  {{#each this}}
  - Member: {{name}}, Total: {{total}}, Backlog: {{backlog}}, In Progress: {{in_progress}}, Review: {{review}}, Done: {{done}}
  {{/each}}

  Based on this data, identify potential workload imbalances or inefficiencies and suggest concrete steps to improve team productivity and balance workload.
`,
});

const generateTeamInsightsFlow = ai.defineFlow(
  {
    name: 'generateTeamInsightsFlow',
    inputSchema: GenerateTeamInsightsInputSchema,
    outputSchema: GenerateTeamInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
