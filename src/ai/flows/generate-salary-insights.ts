
'use server';
/**
 * @fileOverview A Genkit flow that analyzes an employee's monthly performance and salary.
 *
 * - generateSalaryInsight - A function that provides an insight on whether the salary is justified by performance.
 * - GenerateSalaryInsightInput - The input type for the generateSalaryInsight function.
 * - GenerateSalaryInsightOutput - The return type for the generateSalaryInsight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSalaryInsightInputSchema = z.object({
  userName: z.string().describe("The employee's name."),
  hourlyRate: z.number().describe('The hourly rate of the employee.'),
  totalHours: z.number().describe('Total hours worked by the employee in the month.'),
  netSalary: z.number().describe('The net salary received by the employee after deductions.'),
  completedTasks: z.number().describe('The number of tasks completed by the employee in the month.'),
  totalDeductions: z.number().describe('The total amount of deductions for the month.'),
});
export type GenerateSalaryInsightInput = z.infer<typeof GenerateSalaryInsightInputSchema>;

const GenerateSalaryInsightOutputSchema = z.object({
  insight: z.string().describe('A concise analysis in Egyptian Arabic evaluating if the salary is justified by the performance, with suggestions for improvement if needed.'),
});
export type GenerateSalaryInsightOutput = z.infer<typeof GenerateSalaryInsightOutputSchema>;

export async function generateSalaryInsight(input: GenerateSalaryInsightInput): Promise<GenerateSalaryInsightOutput> {
  return generateSalaryInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalaryInsightPrompt',
  input: { schema: GenerateSalaryInsightInputSchema },
  output: { schema: GenerateSalaryInsightOutputSchema },
  prompt: `You are an expert HR analyst. Your task is to provide a concise, data-driven performance insight in Egyptian Arabic based on the provided data for an employee named '{{userName}}'.

**Data for {{userName}}:**
- **Hourly Rate:** {{hourlyRate}} EGP
- **Total Hours Worked:** {{totalHours}} hours
- **Completed Tasks:** {{completedTasks}} tasks
- **Total Deductions:** {{totalDeductions}} EGP
- **Net Salary:** {{netSalary}} EGP

**Your Task:**
1.  **Analyze the data**: Is the net salary justified by the number of completed tasks and hours worked?
2.  **Formulate an insight**: Write a 2-3 sentence analysis in **Egyptian Arabic**.
3.  **Be objective and constructive**:
    - If performance is good (e.g., high task count for hours worked), praise the employee's productivity.
    - If performance seems low (e.g., few tasks completed for many hours worked), provide a constructive suggestion. For example, suggest reviewing task complexity or identifying obstacles.
    - If there are significant deductions, mention it as a factor affecting the net salary.
    - Keep the tone professional and helpful.

**Example Outputs (for guidance):**
- **Good Performance Example:** "أداء ممتاز. إنجاز {{completedTasks}} مهمة في {{totalHours}} ساعة يعكس إنتاجية عالية. الراتب الصافي مستحق بناءً على المجهود المبذول."
- **Average/Low Performance Example:** "تم إنجاز {{completedTasks}} مهمة خلال {{totalHours}} ساعة. قد يكون من المفيد مراجعة صعوبة المهام أو البحث عن أي عقبات لزيادة الإنتاجية في الفترة القادمة."
- **High Deductions Example:** "الراتب الصافي تأثر بوجود خصومات بقيمة {{totalDeductions}} جنيه. الإنتاجية كانت جيدة بإنجاز {{completedTasks}} مهمة."

**Provide only the final insight in the 'insight' field of the JSON output.**`,
});

const generateSalaryInsightFlow = ai.defineFlow(
  {
    name: 'generateSalaryInsightFlow',
    inputSchema: GenerateSalaryInsightInputSchema,
    outputSchema: GenerateSalaryInsightOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
