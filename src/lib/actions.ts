
"use server"

import {
  optimizeWorkflowWithAI,
  type OptimizeWorkflowInput,
  type OptimizeWorkflowOutput,
} from "@/ai/flows/optimize-workflow"
import { z } from "zod"

const ActionInputSchema = z.object({
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
})

export type OptimizerActionState = {
  message?: string
  errors?: {
    workflowDescription?: string[]
    businessGoals?: string[]
    currentChallenges?: string[]
  }
  data?: OptimizeWorkflowOutput
}

export async function getOptimizedWorkflow(
  prevState: OptimizerActionState,
  formData: FormData
): Promise<OptimizerActionState> {
  const validatedFields = ActionInputSchema.safeParse({
    workflowDescription: formData.get("workflowDescription"),
    businessGoals: formData.get("businessGoals"),
    currentChallenges: formData.get("currentChallenges"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors and try again.",
    }
  }

  try {
    const result = await optimizeWorkflowWithAI(validatedFields.data)
    if (result) {
      return { message: "Success", data: result }
    } else {
      return { message: "Failed to get optimization suggestions from AI." }
    }
  } catch (error) {
    console.error(error)
    return { message: "An unexpected error occurred. Please try again later." }
  }
}
