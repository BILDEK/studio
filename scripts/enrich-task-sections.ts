import { getDocs, updateDoc, doc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Anahtar kelime listeleri
const doneKeywords = [
  'done', 'completed', 'finished', 'closed', 'tamamlandı', 'bitirildi', 'kapatıldı'
]
const inProgressKeywords = [
  'in progress', 'working on it', 'pending review', 'active',
  'üzerinde çalışılıyor', 'geliştiriliyor', 'inceleniyor', 'test ediliyor', 'devam ediyor'
]
const validSections = ['To Do', 'In Progress', 'Done']

function containsKeyword(text: string, keywords: string[]) {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

async function enrichTaskSections() {
  const tasksRef = collection(db, 'tasks')
  const snapshot = await getDocs(tasksRef)
  let updatedCount = 0

  for (const taskDoc of snapshot.docs) {
    const data = taskDoc.data()
    let section = data.section
    // Geçerli section kontrolü
    if (!validSections.includes(section)) {
      // Durum analizi
      if (
        containsKeyword(data.status, doneKeywords) ||
        containsKeyword(data.title, doneKeywords) ||
        containsKeyword(data.description, doneKeywords)
      ) {
        section = 'Done'
      } else if (
        containsKeyword(data.status, inProgressKeywords) ||
        containsKeyword(data.title, inProgressKeywords) ||
        containsKeyword(data.description, inProgressKeywords)
      ) {
        section = 'In Progress'
      } else {
        section = 'To Do'
      }
      // Güncelle
      await updateDoc(doc(tasksRef, taskDoc.id), { section })
      updatedCount++
    }
  }
  console.log(`Updated ${updatedCount} tasks with correct section values.`)
}

// Çalıştır
enrichTaskSections()
