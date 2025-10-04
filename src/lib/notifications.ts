import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface Notification {
  id?: string
  type: "task_assigned" | "task_status_changed" | "employee_status_changed" | "low_stock_warning"
  recipientEmail: string
  recipientName: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  metadata?: any
}

const notificationsRef = collection(db, "notifications")

// Existing notification functions ...

export async function createTaskAssignedNotification(
  assigneeEmail: string,
  assigneeName: string,
  taskTitle: string,
  assignedBy: string
) {
  // ... (implementation unchanged)
}

export async function createTaskStatusChangedNotification(
  assigneeEmail: string,
  assigneeName: string,
  taskTitle: string,
  newStatus: string
) {
  // ... (implementation unchanged)
}

export async function createEmployeeStatusChangedNotification(
  employeeEmail: string,
  employeeName: string,
  newStatus: string
) {
  // ... (implementation unchanged)
}

/**
 * Creates a notification for a low stock event.
 * @param productName The name of the product with low stock.
 * @param currentStock The current stock level.
 */
export async function createLowStockNotification(
  productName: string,
  currentStock: number
) {
  try {
    // In a real app, you might fetch a list of managers or inventory specialists to notify.
    const recipient = { email: "manager@example.com", name: "Inventory Manager" };

    const notification: Omit<Notification, "id"> = {
      type: "low_stock_warning",
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      title: "Low Stock Warning",
      message: `Product "${productName}" is running low on stock. Current level: ${currentStock}.`,
      timestamp: new Date(),
      read: false,
      metadata: {
        productName,
        currentStock
      }
    }
    
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: Timestamp.now()
    })
    
    console.log(`Low stock notification created for ${productName}`)
  } catch (error) {
    console.error("Error creating low stock notification:", error)
  }
}
