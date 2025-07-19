
"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { AddProductForm } from "@/components/add-product-form"
import { EditProductForm } from "@/components/edit-product-form"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { UpdateStockDialog } from "@/components/update-stock-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
  image: string
}

const sampleProducts = [
  {
    name: "Eco-Friendly Water Bottle",
    sku: "ECO-WB-500",
    category: "Drinkware",
    stock: 120,
    image: "https://placehold.co/64x64/A3E635/4D7C0F.png",
  },
  {
    name: "Recycled Paper Notebook",
    sku: "REC-NB-A5",
    category: "Stationery",
    stock: 85,
    image: "https://placehold.co/64x64/6EE7B7/047857.png",
  },
  {
    name: "Bamboo Cutlery Set",
    sku: "BAM-CS-01",
    category: "Kitchenware",
    stock: 8,
    image: "https://placehold.co/64x64/34D399/065F46.png",
  },
  {
    name: "Organic Cotton Tote Bag",
    sku: "ORG-TB-LG",
    category: "Accessories",
    stock: 250,
    image: "https://placehold.co/64x64/A7F3D0/064E3B.png",
  },
  {
    name: "Solar-Powered Charger",
    sku: "SOL-PC-10K",
    category: "Electronics",
    stock: 0,
    image: "https://placehold.co/64x64/86EFAC/14532D.png",
  },
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

  const getProductStatus = (stock: number): Product["status"] => {
    if (stock === 0) return "Out of Stock"
    if (stock < 10) return "Low Stock"
    return "In Stock"
  }

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const querySnapshot = await getDocs(inventoryCollectionRef)
      if (querySnapshot.empty) {
        const batch = writeBatch(db)
        sampleProducts.forEach((product) => {
          const newDocRef = doc(inventoryCollectionRef)
          batch.set(newDocRef, product)
        })
        await batch.commit()
        const newQuerySnapshot = await getDocs(inventoryCollectionRef)
        const productsData = newQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: getProductStatus(doc.data().stock),
        } as Product))
        setInventory(productsData)
      } else {
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: getProductStatus(doc.data().stock),
        } as Product))
        setInventory(productsData)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleAddProduct = async (newProductData: Omit<Product, "id" | "status" | "image">) => {
    try {
      await addDoc(inventoryCollectionRef, { ...newProductData, image: `https://placehold.co/64x64.png` })
      fetchInventory()
      setIsAddOpen(false)
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const handleEditProduct = async (id: string, updatedData: Omit<Product, "id" | "status" | "stock" | "image">) => {
    try {
      const productDoc = doc(db, "inventory", id)
      await updateDoc(productDoc, updatedData)
      fetchInventory()
      setIsEditOpen(false)
    } catch (error) {
      console.error("Error editing product:", error)
    }
  }

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const productDoc = doc(db, "inventory", id)
      await updateDoc(productDoc, { stock: newStock })
      fetchInventory()
      setIsUpdateStockOpen(false)
    } catch (error) {
      console.error("Error updating stock:", error)
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    try {
      const productDoc = doc(db, "inventory", selectedProduct.id)
      await deleteDoc(productDoc)
      fetchInventory()
      setIsDeleteAlertOpen(false)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">{status}</Badge>
      case "Low Stock":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">{status}</Badge>
      case "Out of Stock":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
            <CardDescription>Track and manage your product inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading inventory...</TableCell></TableRow>
                ) : inventory.length > 0 ? (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image alt={item.name} className="aspect-square rounded-md object-cover" height="64" src={item.image} width="64" data-ai-hint="product image" />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => { setSelectedProduct(item); setIsEditOpen(true) }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedProduct(item); setIsDetailsOpen(true) }}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setSelectedProduct(item); setIsUpdateStockOpen(true) }}>Update Stock</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedProduct(item); setIsDeleteAlertOpen(true) }}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No products found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddProductForm onAddProduct={handleAddProduct} isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
      
      {selectedProduct && (
        <>
          <EditProductForm product={{ id: selectedProduct.id, name: selectedProduct.name, sku: selectedProduct.sku, category: selectedProduct.category }} onEditProduct={handleEditProduct} isOpen={isEditOpen} onOpenChange={setIsEditOpen} />
          <ProductDetailsDialog product={selectedProduct} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
          <UpdateStockDialog product={selectedProduct} onUpdateStock={handleUpdateStock} isOpen={isUpdateStockOpen} onOpenChange={setIsUpdateStockOpen} />
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the product "{selectedProduct.name}".</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  )
}
