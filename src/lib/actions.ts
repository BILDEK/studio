
'use server'

import { z } from "zod"
import { optimizeWorkflowWithAI, type OptimizeWorkflowOutput } from "@/ai/flows/optimize-workflow"
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";

const optimizerSchema = z.object({
  workflowDescription: z.string().min(10, "Please describe your workflow in more detail."),
  businessGoals: z.string().min(10, "Please describe your business goals in more detail."),
  currentChallenges: z.string().min(10, "Please describe your current challenges in more detail."),
})

export type OptimizerActionState = {
  data?: OptimizeWorkflowOutput
  errors?: {
    workflowDescription?: string[]
    businessGoals?: string[]
    currentChallenges?: string[]
  }
  message?: string
}

export async function getOptimizedWorkflow(
  prevState: OptimizerActionState,
  formData: FormData
): Promise<OptimizerActionState> {
  const validatedFields = optimizerSchema.safeParse({
    workflowDescription: formData.get("workflowDescription"),
    businessGoals: formData.get("businessGoals"),
    currentChallenges: formData.get("currentChallenges"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors in the form.",
    }
  }
  
  try {
    const output = await optimizeWorkflowWithAI(validatedFields.data);
    return {
      data: output,
      message: "Successfully generated suggestions.",
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to get suggestions. Please try again.",
    };
  }
}


export const migrateTest0ToEmployees = async () => {
  try {
    const test0CollectionRef = collection(db, "test0");
    const employeesCollectionRef = collection(db, "employees");

    const querySnapshot = await getDocs(test0CollectionRef);

    if (querySnapshot.empty) {
      console.log("No documents found in 'test0' collection.");
      return;
    }

    const batch = writeBatch(db);

    querySnapshot.forEach((documentSnapshot) => {
      const newDocRef = doc(employeesCollectionRef, documentSnapshot.id); // Use same document ID
      batch.set(newDocRef, documentSnapshot.data());
    });

    await batch.commit();
    console.log("Successfully migrated data from 'test0' to 'employees'.");

    const deleteBatch = writeBatch(db);
    querySnapshot.forEach((documentSnapshot) => {
      const docRef = doc(test0CollectionRef, documentSnapshot.id);
      deleteBatch.delete(docRef);
    });
    await deleteBatch.commit();
    console.log("Successfully deleted 'test0' collection documents.");

  } catch (error) {
    console.error("Error migrating data:", error);
    throw error;
  }
};
