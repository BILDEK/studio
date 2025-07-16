// Optimize the existing workflows by suggesting optimizations using AI.
'use server';

/**
 * @fileOverview Provides an AI-powered tool to analyze and optimize existing workflows.
 *
 * - optimizeWorkflowWithAI - Analyzes existing workflows and suggests optimizations.
 * - OptimizeWorkflowInput - The input type for the optimizeWorkflowWithAI function.
 * - OptimizeWorkflowOutput - The return type for the optimizeWorkflowWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeWorkflowInputSchema = z.object({
  workflowDescription: z
    .string()
    .describe('Detailed description of the existing workflow to be optimized.'),
  businessGoals: z
    .string()
    .describe(
      'Description of the overall business goals the workflow should achieve.'
    ),
  currentChallenges: z
    .string()
    .describe(
      'Description of the current challenges and bottlenecks in the workflow.'
    ),
});

export type OptimizeWorkflowInput = z.infer<typeof OptimizeWorkflowInputSchema>;

const OptimizeWorkflowOutputSchema = z.object({
  optimizedWorkflowSuggestions: z
    .string()
    .describe(
      'AI-powered suggestions for optimizing the workflow, addressing the challenges and aligning with business goals.'
    ),
  potentialBenefits: z
    .string()
    .describe(
      'Description of the potential benefits of implementing the suggested optimizations.'
    ),
});

export type OptimizeWorkflowOutput = z.infer<typeof OptimizeWorkflowOutputSchema>;

export async function optimizeWorkflowWithAI(input: OptimizeWorkflowInput): Promise<OptimizeWorkflowOutput> {
  return optimizeWorkflowFlow(input);
}

const optimizeWorkflowPrompt = ai.definePrompt({
  name: 'optimizeWorkflowPrompt',
  input: {schema: OptimizeWorkflowInputSchema},
  output: {schema: OptimizeWorkflowOutputSchema},
  prompt: `You are an AI-powered business consultant specializing in workflow optimization.

You will analyze the provided workflow description, business goals, and current challenges to suggest actionable optimizations.

Consider how to streamline processes, reduce bottlenecks, and improve overall efficiency.

Workflow Description: {{{workflowDescription}}}
Business Goals: {{{businessGoals}}}
Current Challenges: {{{currentChallenges}}}

Based on this information, provide specific, actionable suggestions for optimizing the workflow and explain the potential benefits of these changes.
`,
});

const optimizeWorkflowFlow = ai.defineFlow(
  {
    name: 'optimizeWorkflowFlow',
    inputSchema: OptimizeWorkflowInputSchema,
    outputSchema: OptimizeWorkflowOutputSchema,
  },
  async input => {
    const {output} = await optimizeWorkflowPrompt(input);
    return output!;
  }
);
