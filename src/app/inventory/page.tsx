
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
import { createLowStockNotification } from "@/lib/notifications"

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

// Sample data to seed the database if it's empty
const sampleProducts = [
  {
    id: 'prod-1',
    name: 'Eco-Friendly Water Bottle',
    sku: 'ECO-WB-500',
    category: 'Drinkware',
    stock: 75,
    lowStockThreshold: 20,
    image: '/products/bottle.png',
  },
  {
    id: 'prod-2',
    name: 'Recycled Paper Notebook',
    sku: 'REC-NB-A5',
    category: 'Stationery',
    stock: 15,
    lowStockThreshold: 25,
    image: '/products/notebook.png',
  },
  {
    id: 'prod-3',
    name: 'Bamboo Coffee Cup',
    sku: 'BAM-CC-350',
    category: 'Kitchenware',
    stock: 0,
    lowStockThreshold: 15,
    image: '/products/cup.png',
  },
  {
    id: 'prod-4',
    name: 'Organic Cotton Tote Bag',
    sku: 'ORG-TB-LG',
    category: 'Accessories',
    stock: 120,
    lowStockThreshold: 30,
    image: '/products/tote.png',
  },
  {
    id: 'prod-5',
    name: 'Solar Powered Charger',
    sku: 'SOL-CHG-10K',
    category: 'Electronics',
    stock: 40,
    lowStockThreshold: 15,
    image: '/products/charger.png',
  },
];

const inventoryCollectionRef = collection(db, "inventory");

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getProductStatus = (stock: number, threshold: number): Product["status"] => {
    if (stock <= 0) return "Out of Stock";
    if (stock < threshold) return "Low Stock";
    return "In Stock";
  };

  // Fetches inventory and seeds the database with sample data if it's empty
  const fetchInventory = async (isSeeding = false) => {
    if (!isSeeding) setIsLoading(true);
    try {
      const querySnapshot = await getDocs(inventoryCollectionRef);
      if (querySnapshot.empty) {
        console.log("Empty inventory, seeding with sample data...");
        const batch = writeBatch(db);
        sampleProducts.forEach(product => {
          const docRef = doc(inventoryCollectionRef, product.id);
          batch.set(docRef, product);
        });
        await batch.commit();
        // After seeding, fetch again to display the new data
        await fetchInventory(true); 
        return;
      }

      const inventoryData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const stock = data.stock || 0;
        const lowStockThreshold = data.lowStockThreshold || 0;
        return {
          id: doc.id,
          name: data.name,
          sku: data.sku,
          category: data.category,
          stock: stock,
          lowStockThreshold: lowStockThreshold,
          status: getProductStatus(stock, lowStockThreshold),
          image: data.image || '/placeholder.svg',
        } as Product;
      });
      setInventory(inventoryData);
    } catch (error) {
      console.error("Error fetching inventory: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddProduct = async (productData: ProductFormValues) => {
    try {
      const newDocRef = await addDoc(inventoryCollectionRef, { ...productData, image: '/placeholder.svg' });
      fetchInventory();
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const handleEditProduct = async (id: string, productData: ProductFormValues) => {
    try {
      const productDoc = doc(db, "inventory", id);
      await updateDoc(productDoc, productData as any);
      fetchInventory();
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error editing product: ", error);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    const productToUpdate = inventory.find(p => p.id === id);
    if (!productToUpdate) return;

    try {
      const productDoc = doc(db, "inventory", id);
      await updateDoc(productDoc, { stock: newStock });
      
      if (newStock < productToUpdate.lowStockThreshold && productToUpdate.stock >= productToUpdate.lowStockThreshold) {
        await createLowStockNotification(productToUpdate.name, newStock);
      }

      fetchInventory();
      setIsUpdateStockOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await deleteDoc(doc(db, "inventory", selectedProduct.id));
      fetchInventory();
      setIsDeleteAlertOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "In Stock": return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">In Stock</Badge>;
      case "Low Stock": return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100">Low Stock</Badge>;
      case "Out of Stock": return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading inventory...</TableCell></TableRow>
              ) : inventory.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">No products found.</TableCell></TableRow>
              ) : (
                inventory.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image alt={product.name} className="aspect-square rounded-md object-cover" height="64" src={product.image} width="64" />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => { setSelectedProduct(product); setIsDetailsOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setSelectedProduct(product); setIsUpdateStockOpen(true); }}>Update Stock</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setSelectedProduct(product); setIsEditOpen(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedProduct(product); setIsDeleteAlertOpen(true); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddProductForm isOpen={isAddOpen} onOpenChange={setIsAddOpen} onAddProduct={handleAddProduct} />

      {selectedProduct && (
        <>
          <EditProductForm isOpen={isEditOpen} onOpenChange={setIsEditOpen} onEditProduct={handleEditProduct} product={selectedProduct} />
          <ProductDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} product={selectedProduct} getStatusBadge={getStatusBadge} />
          <UpdateStockDialog isOpen={isUpdateStockOpen} onOpenChange={setIsUpdateStockOpen} onUpdateStock={handleUpdateStock} product={selectedProduct} />
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete "{selectedProduct.name}".</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedProduct(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  )
}
