import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface Notification {
  id?: string
  type: "task_assigned" | "task_status_changed" | "employee_status_changed"
  recipientEmail: string
  recipientName: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  metadata?: any
}

const notificationsRef = collection(db, "notifications")

export async function createTaskAssignedNotification(
  assigneeEmail: string,
  assigneeName: string,
  taskTitle: string,
  assignedBy: string
) {
  try {
    const notification: Omit<Notification, "id"> = {
      type: "task_assigned",
      recipientEmail: assigneeEmail,
      recipientName: assigneeName,
      title: "New Task Assigned",
      message: `You have been assigned a new task: "${taskTitle}" by ${assignedBy}`,
      timestamp: new Date(),
      read: false,
      metadata: {
        taskTitle,
        assignedBy
      }
    }
    
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: Timestamp.now()
    })
    
    console.log(`Notification created for ${assigneeName}`)
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function createTaskStatusChangedNotification(
  assigneeEmail: string,
  assigneeName: string,
  taskTitle: string,
  newStatus: string
) {
  try {
    const notification: Omit<Notification, "id"> = {
      type: "task_status_changed",
      recipientEmail: assigneeEmail,
      recipientName: assigneeName,
      title: "Task Status Updated",
      message: `Task "${taskTitle}" status changed to "${newStatus}"`,
      timestamp: new Date(),
      read: false,
      metadata: {
        taskTitle,
        newStatus
      }
    }
    
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: Timestamp.now()
    })
    
    console.log(`Status change notification created for ${assigneeName}`)
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function createEmployeeStatusChangedNotification(
  employeeEmail: string,
  employeeName: string,
  newStatus: string
) {
  try {
    const notification: Omit<Notification, "id"> = {
      type: "employee_status_changed",
      recipientEmail: employeeEmail,
      recipientName: employeeName,
      title: "Your Status Changed",
      message: `Your employee status has been changed to "${newStatus}"`,
      timestamp: new Date(),
      read: false,
      metadata: {
        newStatus
      }
    }
    
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: Timestamp.now()
    })
    
    console.log(`Employee status notification created for ${employeeName}`)
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}
