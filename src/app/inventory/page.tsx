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
import Image from "next/image"

const inventoryItems = [
  {
    id: "prod-001",
    name: "Eco-Friendly Water Bottle",
    sku: "ECO-WB-500",
    category: "Drinkware",
    stock: 120,
    status: "In Stock",
    image: "https://placehold.co/64x64/A3E635/4D7C0F.png",
  },
  {
    id: "prod-002",
    name: "Recycled Paper Notebook",
    sku: "REC-NB-A5",
    category: "Stationery",
    stock: 85,
    status: "In Stock",
    image: "https://placehold.co/64x64/6EE7B7/047857.png",
  },
  {
    id: "prod-003",
    name: "Bamboo Cutlery Set",
    sku: "BAM-CS-01",
    category: "Kitchenware",
    stock: 8,
    status: "Low Stock",
    image: "https://placehold.co/64x64/34D399/065F46.png",
  },
  {
    id: "prod-004",
    name: "Organic Cotton Tote Bag",
    sku: "ORG-TB-LG",
    category: "Accessories",
    stock: 250,
    status: "In Stock",
    image: "https://placehold.co/64x64/A7F3D0/064E3B.png",
  },
  {
    id: "prod-005",
    name: "Solar-Powered Charger",
    sku: "SOL-PC-10K",
    category: "Electronics",
    stock: 0,
    status: "Out of Stock",
    image: "https://placehold.co/64x64/86EFAC/14532D.png",
  },
]

export default function InventoryPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return (
          <Badge className="bg-primary/20 text-primary-foreground border-primary/20 hover:bg-primary/30">
            {status}
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="destructive" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/30">
            {status}
          </Badge>
        )
      case "Out of Stock":
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-500/20 hover:bg-red-500/30">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
            <CardDescription>
              Track and manage your product inventory.
            </CardDescription>
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
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={item.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={item.image}
                        width="64"
                        data-ai-hint="product image"
                      />
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Update Stock</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
