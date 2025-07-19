
"use client"

import * as React from "react"
import Image from "next/image"
import type { Product } from "@/app/inventory/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "./ui/separator"

interface ProductDetailsDialogProps {
  product: Product
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function ProductDetailsDialog({
  product,
  isOpen,
  onOpenChange,
}: ProductDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-800 border-green-200">{status}</Badge>
      case "Low Stock":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{status}</Badge>
      case "Out of Stock":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>
            Full details for {product.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-4">
          <Image
            alt={product.name}
            className="aspect-square rounded-md object-cover"
            height="128"
            src={product.image}
            width="128"
            data-ai-hint="product image"
          />
          <div className="text-center">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-muted-foreground">{product.category}</p>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="grid gap-2 text-sm">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">SKU</span>
            <span className="col-span-2">{product.sku}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">Status</span>
            <div className="col-span-2">{getStatusBadge(product.status)}</div>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">Stock</span>
            <span className="col-span-2">{product.stock} units</span>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
