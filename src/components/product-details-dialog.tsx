
"use client"

import * as React from "react"
import Image from "next/image"
import type { Product } from "@/app/inventory/page"
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
  getStatusBadge: (status: Product["status"]) => React.ReactNode
}

export function ProductDetailsDialog({
  product,
  isOpen,
  onOpenChange,
  getStatusBadge,
}: ProductDetailsDialogProps) {

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
           <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">Low Stock At</span>
            <span className="col-span-2">{product.lowStockThreshold} units</span>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
