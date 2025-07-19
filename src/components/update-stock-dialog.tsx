
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { Product } from "@/app/inventory/page"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const updateStockSchema = z.object({
  stock: z.coerce.number().min(0, "Stock cannot be negative."),
})

type UpdateStockValues = z.infer<typeof updateStockSchema>

interface UpdateStockDialogProps {
  product: Product
  onUpdateStock: (id: string, newStock: number) => void
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function UpdateStockDialog({
  product,
  onUpdateStock,
  isOpen,
  onOpenChange,
}: UpdateStockDialogProps) {
  const form = useForm<UpdateStockValues>({
    resolver: zodResolver(updateStockSchema),
    defaultValues: {
      stock: product.stock,
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        stock: product.stock,
      })
    }
  }, [product, form, isOpen])

  function onSubmit(data: UpdateStockValues) {
    onUpdateStock(product.id, data.stock)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Stock for {product.name}</DialogTitle>
          <DialogDescription>
            Enter the new stock quantity. The current stock is {product.stock}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Update Stock</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
