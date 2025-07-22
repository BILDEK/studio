import { getDocs, updateDoc, doc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function fixTaskStatuses() {
  const tasksRef = collection(db, 'tasks')
  const snapshot = await getDocs(tasksRef)
  let updatedCount = 0

  for (const taskDoc of snapshot.docs) {
    const data = taskDoc.data()
    let status = data.status
    // "open" veya "new" ise "todo" yap
    if (status === "open" || status === "new") {
      status = "todo"
      await updateDoc(doc(tasksRef, taskDoc.id), { status })
      updatedCount++
      continue
    }
    // "completed", "closed", "finished" ise "done" yap
    if (["completed", "closed", "finished"].includes(status)) {
      status = "done"
      await updateDoc(doc(tasksRef, taskDoc.id), { status })
      updatedCount++
      continue
    }
    // "in progress", "working on it", "pending review", "active" ise "inProgress" yap
    if (["in progress", "working on it", "pending review", "active"].includes(status)) {
      status = "inProgress"
      await updateDoc(doc(tasksRef, taskDoc.id), { status })
      updatedCount++
      continue
    }
  }
  console.log(`Updated ${updatedCount} tasks with correct status values.`)
}

fixTaskStatuses()
