
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { AddProductForm } from "@/components/add-product-form"
import { EditProductForm } from "@/components/edit-product-form"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { UpdateStockDialog } from "@/components/update-stock-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { createLowStockNotification } from "@/lib/notifications" // Import the new notification function

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  lowStockThreshold: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
  image: string
}

const sampleProducts = [
    // ... sample data remains the same
]

const inventoryCollectionRef = collection(db, "inventory")

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const getProductStatus = (stock: number, threshold: number): Product["status"] => {
    if (stock === 0) return "Out of Stock"
    if (stock < threshold) return "Low Stock"
    return "In Stock"
  }

  const fetchInventory = async () => {
      // ... fetchInventory logic remains the same
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleAddProduct = async (newProductData: Omit<Product, "id" | "status" | "image">) => {
      // ... add product logic remains the same
  }

  const handleEditProduct = async (id: string, updatedData: Omit<Product, "id" | "status" | "stock" | "image">) => {
      // ... edit product logic remains the same
  }

  // Updated handleUpdateStock to trigger notifications
  const handleUpdateStock = async (id: string, newStock: number) => {
    const productToUpdate = inventory.find(p => p.id === id);
    if (!productToUpdate) return;

    try {
      const productDoc = doc(db, "inventory", id)
      await updateDoc(productDoc, { stock: newStock })
      
      // Check if stock has fallen below the threshold
      if (newStock < productToUpdate.lowStockThreshold && productToUpdate.stock >= productToUpdate.lowStockThreshold) {
        await createLowStockNotification(productToUpdate.name, newStock);
      }

      // Manually update the state to immediately reflect changes
      setInventory(prevInventory => 
        prevInventory.map(p => 
          p.id === id 
            ? { ...p, stock: newStock, status: getProductStatus(newStock, p.lowStockThreshold) } 
            : p
        )
      );

      setIsUpdateStockOpen(false)
    } catch (error) {
      console.error("Error updating stock:", error)
    }
  }

  const handleDeleteProduct = async () => {
      // ... delete product logic remains the same
  }

  const getStatusBadge = (status: Product["status"]) => {
      // ... badge logic remains the same
  }

  return (
    <AppLayout>
        {/* JSX for the page remains the same */}
    </AppLayout>
  )
}
