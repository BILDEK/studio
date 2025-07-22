import { faker } from '@faker-js/faker'
import { collection, Timestamp, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import dotenv from 'dotenv'
dotenv.config()

const TASK_COUNT = 20
const tasksCollectionRef = collection(db, 'tasks')

const statuses = ['open', 'completed', 'overdue']

const titles = [
  'Prepare monthly report', 'Update website', 'Client meeting', 'Design new logo', 'Fix bugs', 'Inventory check', 'Team training', 'Social media post', 'Product launch', 'Market research', 'Write documentation', 'Review code', 'Customer support', 'Plan event', 'Data backup', 'Security audit', 'Test new feature', 'Optimize database', 'Update pricing', 'Send newsletter'
]

async function seedTasks() {
  const sections = ['todo', 'in-progress', 'done']
  for (let i = 0; i < TASK_COUNT; i++) {
    const title = titles[i % titles.length]
    const status = faker.helpers.arrayElement(statuses)
    const dueDate = Timestamp.fromDate(faker.date.soon({ days: 30 }))
    const assignedTo = faker.person.fullName()
    const section = faker.helpers.arrayElement(sections)
    await addDoc(tasksCollectionRef, {
      title,
      status,
      dueDate,
      assignedTo,
      section,
      description: faker.lorem.sentence(),
      createdAt: Timestamp.fromDate(faker.date.past({ years: 1 }))
    })
  }
  console.log('Seeded 20 tasks.')
}

seedTasks()
