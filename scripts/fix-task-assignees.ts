import { getDocs, updateDoc, doc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function fixTaskAssignees() {
  const employeesRef = collection(db, 'employees')
  const tasksRef = collection(db, 'tasks')
  const employeesSnapshot = await getDocs(employeesRef)
  const tasksSnapshot = await getDocs(tasksRef)

  const employees = employeesSnapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name || '',
      avatar: data.avatar || '',
    }
  })

  let updatedCount = 0

  for (const taskDoc of tasksSnapshot.docs) {
    const data = taskDoc.data()
    // Eksik assignee veya avatar veya priority kontrolü
    let needsUpdate = false
    let updateObj: any = {}

    // Assignee kontrolü
    if (!data.assignee || data.assignee === 'Unknown' || data.assignee === 'unknown') {
      const randomEmployee = employees[Math.floor(Math.random() * employees.length)]
      if (randomEmployee) {
        updateObj.assignee = randomEmployee.name
        updateObj.assigneeId = randomEmployee.id
        updateObj.avatar = randomEmployee.avatar
        needsUpdate = true
      }
    } else if (!data.avatar) {
      // Assignee var ama avatar yoksa, bul ve ekle
      const found = employees.find(e => e.name === data.assignee)
      if (found) {
        updateObj.avatar = found.avatar
        updateObj.assigneeId = found.id
        needsUpdate = true
      }
    }

    // Priority kontrolü
    if (!data.priority || !['Low', 'Medium', 'High'].includes(data.priority)) {
      const priorities = ['Low', 'Medium', 'High']
      updateObj.priority = priorities[Math.floor(Math.random() * priorities.length)]
      needsUpdate = true
    }

    if (needsUpdate) {
      await updateDoc(doc(tasksRef, taskDoc.id), updateObj)
      updatedCount++
    }
  }
  console.log(`Updated ${updatedCount} tasks with random assignees and priorities where needed.`)
}

fixTaskAssignees()
