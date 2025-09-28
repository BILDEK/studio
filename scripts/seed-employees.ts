import { faker } from '@faker-js/faker'
import { collection, addDoc, Timestamp, writeBatch, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDKNSbt5df1kuI7tfECMDl5QEdVAUEqT6s",
  authDomain: "verdantflow-8lsqk.firebaseapp.com",
  projectId: "verdantflow-8lsqk",
  storageBucket: "verdantflow-8lsqk.firebasestorage.app",
  messagingSenderId: "56107029688",
  appId: "1:56107029688:web:3c20cc2787fe61db7f504d"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const EMPLOYEE_COUNT = 42
const employeesCollectionRef = collection(db, 'employees')

const roles = [
  'Project Manager', 'Lead Developer', 'UX Designer', 'Marketing Specialist', 'Intern', 'HR Specialist', 'QA Engineer', 'Sales Representative', 'Support Agent', 'Finance Analyst', 'Product Owner', 'Scrum Master', 'Designer', 'DevOps Engineer', 'Content Writer', 'Business Analyst', 'Frontend Developer', 'Backend Developer', 'Mobile Developer', 'Data Scientist', 'Security Specialist', 'Office Manager', 'Customer Success', 'Legal Advisor', 'IT Specialist', 'Operations Manager', 'Growth Hacker', 'Account Manager', 'Copywriter', 'Community Manager', 'Trainer', 'Researcher', 'Architect', 'Consultant', 'Executive', 'Director', 'Coordinator', 'Supervisor', 'Assistant', 'Technician', 'Strategist', 'Planner', 'Administrator'
]

const statuses = ['Active', 'Inactive', 'On Leave']

function getRandomStatus() {
  const rand = Math.random()
  if (rand < 0.7) return 'Active'
  if (rand < 0.9) return 'On Leave'
  return 'Inactive'
}

async function clearEmployees() {
  const snapshot = await getDocs(employeesCollectionRef)
  const batch = writeBatch(db)
  snapshot.forEach((docSnap) => batch.delete(docSnap.ref))
  await batch.commit()
}

async function seedEmployees() {
  await clearEmployees()
  const batch = writeBatch(db)
  for (let i = 0; i < EMPLOYEE_COUNT; i++) {
    const name = faker.person.fullName()
    const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] })
    const role = roles[i % roles.length]
    const status = getRandomStatus()
    const avatar = faker.image.avatar()
    const lastActivity = Timestamp.fromDate(faker.date.recent({ days: 30 }))
    const autoId = faker.string.uuid()
    batch.set(doc(db, 'employees', autoId), { name, email, role, status, avatar, lastActivity })
  }
  await batch.commit()
  console.log('Seeded 42 employees.')
}

seedEmployees()
