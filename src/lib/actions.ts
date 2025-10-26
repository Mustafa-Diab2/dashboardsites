'use server';

import { generateTeamInsights as generateTeamInsightsFlow, GenerateTeamInsightsInput } from '@/ai/flows/generate-team-insights';

export async function generateTeamInsights(input: GenerateTeamInsightsInput): Promise<{ insights: string | null, error?: string }> {
  try {
    const result = await generateTeamInsightsFlow(input);
    return { insights: result.insights };
  } catch (error: any) {
    console.error("Error generating team insights:", error);
    // Return the actual error message for better debugging on the client-side
    return { insights: null, error: error.message || "An unknown error occurred while generating insights." };
  }
}
