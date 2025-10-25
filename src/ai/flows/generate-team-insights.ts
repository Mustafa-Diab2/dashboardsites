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

const TeamMemberSummarySchema = z.object({
  name: z.string().describe('The name of the team member.'),
  total: z.number().describe('The total number of tasks assigned to the member.'),
  backlog: z.number().describe('The number of tasks in the backlog for the member.'),
  in_progress: z.number().describe('The number of tasks in progress for the member.'),
  review: z.number().describe('The number of tasks under review for the member.'),
  done: z.number().describe('The number of tasks completed by the member.'),
});

const GenerateTeamInsightsInputSchema = z.object({
  taskDistribution: z.array(TeamMemberSummarySchema).describe('An array of task summaries for each team member.'),
  reportType: z.enum(['summary', 'detailed']).describe("The type of report to generate: a brief 'summary' or a 'detailed' analysis."),
  target: z.string().describe("The focus of the report: 'all' for the entire team, or a specific member's name."),
});

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
  prompt: `You are an expert project manager AI assistant. Your role is to analyze team task distribution and provide actionable insights in Arabic.

  **Analyze the following data based on the user's request.**

  **Report Type Requested:** {{reportType}}
  **Report Target:** {{target}}

  **Team Data:**
  {{#each taskDistribution}}
  - Member: {{name}}, Total: {{total}}, Backlog: {{backlog}}, In Progress: {{in_progress}}, Review: {{review}}, Done: {{done}}
  {{/each}}

  **Your Task:**

  {{#if (eq target "all")}}
    {{#if (eq reportType "summary")}}
      - Provide a brief, high-level summary (2-3 sentences) of the team's overall workload and performance.
      - Identify the most significant bottleneck or imbalance.
    {{else}}
      - Provide a detailed analysis of the entire team's workload distribution.
      - Compare members' workloads, identifying who is overloaded and who is under-utilized.
      - Pinpoint specific bottlenecks in the workflow (e.g., a high number of tasks in 'Review').
      - Offer at least 3 concrete, actionable recommendations for improving team balance and efficiency.
    {{/if}}
  {{else}}
    {{#if (eq reportType "summary")}}
      - Provide a brief, high-level summary (2-3 sentences) of the performance and current workload for **{{target}}**.
    {{else}}
      - Provide a detailed analysis of **{{target}}**'s tasks.
      - Evaluate their productivity (e.g., number of completed tasks vs. in-progress).
      - Compare their workload to the team average if possible.
      - Suggest specific actions for **{{target}}** or the manager to improve their effectiveness or manage their workload.
    {{/if}}
  {{/if}}

  **Output must be in Arabic.**
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
