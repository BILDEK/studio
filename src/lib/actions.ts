
'use server'

import { z } from "zod"
import { optimizeWorkflowWithAI, type OptimizeWorkflowOutput } from "@/ai/flows/optimize-workflow"
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc, deleteDoc, DocumentData } from "firebase/firestore";

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

export const deleteDuplicateEmployees = async () => {
  try {
    const employeesCollectionRef = collection(db, "employees");
    const querySnapshot = await getDocs(employeesCollectionRef);
    
    if (querySnapshot.empty) {
      return { message: "No employees found." };
    }

    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();
    const idsToDelete = new Set<string>();

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      const email = data.email;
      const name = data.name;

      let isDuplicate = false;

      if (email && seenEmails.has(email)) {
        isDuplicate = true;
      }
      if (name && seenNames.has(name)) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        idsToDelete.add(doc.id);
      } else {
        if (email) seenEmails.add(email);
        if (name) seenNames.add(name);
      }
    });

    if (idsToDelete.size > 0) {
      const batch = writeBatch(db);
      idsToDelete.forEach((id) => {
        batch.delete(doc(db, "employees", id));
      });
      await batch.commit();
      return { message: `Successfully deleted ${idsToDelete.size} duplicate employees.` };
    } else {
      return { message: "No duplicate employees found." };
    }
  } catch (error) {
    console.error("Error deleting duplicate employees:", error);
    throw new Error("Failed to delete duplicate employees.");
  }
};
    
