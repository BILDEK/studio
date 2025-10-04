
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type Product } from "@/app/inventory/page";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Updated schema to include the new field
const editProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  sku: z.string().min(1, "SKU is required."),
  category: z.string().min(1, "Please select a category."),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative."),
})

// This is the type for the form data, derived from the Zod schema.
// It excludes fields not edited in this form (like id, stock, status).
type EditProductValues = z.infer<typeof editProductSchema>

interface EditProductFormProps {
  product: Product // Pass the full Product object
  onEditProduct: (id: string, data: EditProductValues) => void
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EditProductForm({
  product,
  onEditProduct,
  isOpen,
  onOpenChange,
}: EditProductFormProps) {
  const form = useForm<EditProductValues>({
    resolver: zodResolver(editProductSchema),
  })

  // Use useEffect to reset the form whenever the product or isOpen state changes.
  // This ensures the form is pre-populated with the correct data when opened.
  React.useEffect(() => {
    if (product && isOpen) {
      form.reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        lowStockThreshold: product.lowStockThreshold,
      })
    }
  }, [product, isOpen, form])

  function onSubmit(data: EditProductValues) {
    onEditProduct(product.id, data)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for this product. Stock is updated separately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Drinkware">Drinkware</SelectItem><SelectItem value="Stationery">Stationery</SelectItem><SelectItem value="Kitchenware">Kitchenware</SelectItem><SelectItem value="Accessories">Accessories</SelectItem><SelectItem value="Electronics">Electronics</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (<FormItem><FormLabel>Low Stock At</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
