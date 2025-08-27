import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import CreateInventoryModal from "@/components/modals/CreateInventoryModal";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 10;
  
  const inventory = [
    {
      id: 1,
      product: "Arena Miau Miau Premium 10kg",
      sku: "MM-PREM-10",
      category: "Premium",
      city: "Bogotá",
      stock: 150,
      minStock: 50,
      maxStock: 500,
      price: 45000,
      lastUpdate: "2024-01-15",
      supplier: "Proveedor Norte"
    },
    {
      id: 2,
      product: "Arena Miau Miau Antibacterial 5kg",
      sku: "MM-ANTI-05",
      category: "Antibacterial",
      city: "Medellín", 
      stock: 25,
      minStock: 30,
      maxStock: 200,
      price: 28000,
      lastUpdate: "2024-01-14",
      supplier: "Distribuidora Centro"
    },
    {
      id: 3,
      product: "Arena Miau Miau Perfumada 15kg",
      sku: "MM-PERF-15",
      category: "Perfumada",
      city: "Cali",
      stock: 0,
      minStock: 20,
      maxStock: 150,
      price: 52000,
      lastUpdate: "2024-01-10",
      supplier: "Logística Sur"
    },
    {
      id: 4,
      product: "Arena Miau Miau Básica 8kg",
      sku: "MM-BASI-08",
      category: "Básica",
      city: "Barranquilla",
      stock: 320,
      minStock: 100,
      maxStock: 600,
      price: 18000,
      lastUpdate: "2024-01-15",
      supplier: "Mayorista Costa"
    },
    {
      id: 5,
      product: "Arena Miau Miau Premium 10kg",
      sku: "MM-PREM-10",
      category: "Premium", 
      city: "Cartagena",
      stock: 75,
      minStock: 40,
      maxStock: 300,
      price: 47000,
      lastUpdate: "2024-01-13",
      supplier: "Mayorista Costa"
    },
    {
      id: 6,
      product: "Arena Miau Miau Ultra 12kg",
      sku: "MM-ULTR-12",
      category: "Ultra",
      city: "Bucaramanga",
      stock: 180,
      minStock: 60,
      maxStock: 400,
      price: 58000,
      lastUpdate: "2024-01-15",
      supplier: "Proveedor Oriente"
    },
    {
      id: 7,
      product: "Arena Miau Miau Antibacterial 5kg",
      sku: "MM-ANTI-05",
      category: "Antibacterial",
      city: "Pereira",
      stock: 45,
      minStock: 25,
      maxStock: 180,
      price: 29000,
      lastUpdate: "2024-01-12",
      supplier: "Distribuidora Centro"
    },
    {
      id: 8,
      product: "Arena Miau Miau Perfumada 15kg", 
      sku: "MM-PERF-15",
      category: "Perfumada",
      city: "Manizales",
      stock: 12,
      minStock: 15,
      maxStock: 120,
      price: 53000,
      lastUpdate: "2024-01-11",
      supplier: "Logística Centro"
    },
    // Agregar más productos para demostrar paginación
    ...Array.from({ length: 20 }, (_, i) => ({
      id: 9 + i,
      product: `Arena Miau Miau ${['Premium', 'Antibacterial', 'Perfumada', 'Básica', 'Ultra'][Math.floor(Math.random() * 5)]} ${[5, 8, 10, 12, 15][Math.floor(Math.random() * 5)]}kg`,
      sku: `MM-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      category: ['Premium', 'Antibacterial', 'Perfumada', 'Básica', 'Ultra'][Math.floor(Math.random() * 5)],
      city: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'][Math.floor(Math.random() * 5)],
      stock: Math.floor(Math.random() * 300),
      minStock: Math.floor(Math.random() * 50 + 10),
      maxStock: Math.floor(Math.random() * 400 + 100),
      price: Math.floor(Math.random() * 40000 + 15000),
      lastUpdate: "2024-01-15",
      supplier: ['Proveedor Norte', 'Distribuidora Centro', 'Logística Sur'][Math.floor(Math.random() * 3)]
    }))
  ];

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: "Sin Stock", color: "bg-destructive text-destructive-foreground" };
    if (stock <= minStock) return { status: "Stock Bajo", color: "bg-warning text-warning-foreground" };
    return { status: "Normal", color: "bg-success text-success-foreground" };
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      "Premium": "bg-primary text-primary-foreground",
      "Ultra": "bg-primary/80 text-primary-foreground",
      "Antibacterial": "bg-success/20 text-success",
      "Perfumada": "bg-primary/20 text-primary",
      "Básica": "bg-secondary text-secondary-foreground"
    };
    return <Badge className={categoryColors[category]}>{category}</Badge>;
  };

  const filteredInventory = inventory.filter(item =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Inventario</h1>
          <p className="text-muted-foreground">
            Control de stock de productos Miau Miau por ciudad
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Package className="h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario por Ciudad</CardTitle>
          <CardDescription>
            Stock disponible de arena para gatos Miau Miau en cada ubicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos por nombre, SKU, ciudad o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInventory.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.minStock);
                  return (
                    <TableRow key={item.id} className={item.stock <= item.minStock ? "bg-warning/5" : ""}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {item.product}
                            {item.stock <= item.minStock && <AlertTriangle className="h-4 w-4 text-warning" />}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">{item.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.city}</TableCell>
                      <TableCell>
                        {getCategoryBadge(item.category)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.stock} unidades</div>
                          <div className="text-xs text-muted-foreground">
                            Mín: {item.minStock} | Máx: {item.maxStock}
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${item.stock <= item.minStock ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${Math.min((item.stock / item.maxStock) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${item.price.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.supplier}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Actualizar Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="mr-2 h-4 w-4" />
                              Hacer Pedido
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredInventory.length)} de {filteredInventory.length} productos
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <CreateInventoryModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Inventory;