'use server';

import { generateTeamInsights as generateTeamInsightsFlow, GenerateTeamInsightsInput } from '@/ai/flows/generate-team-insights';

export async function generateTeamInsights(input: GenerateTeamInsightsInput) {
  try {
    const result = await generateTeamInsightsFlow(input);
    return result;
  } catch (error) {
    console.error("Error generating team insights:", error);
    return { insights: "Sorry, I couldn't generate insights at this moment. Please try again later." };
  }
}
