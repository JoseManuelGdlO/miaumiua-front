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
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserCheck, Star, MessageSquare, Phone } from "lucide-react";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const customers = [
    {
      id: 1,
      name: "María González",
      email: "maria.gonzalez@gmail.com",
      phone: "+57 320 123 4567",
      city: "Bogotá",
      registrationDate: "2023-11-15",
      lastOrder: "2024-01-12",
      totalOrders: 15,
      totalSpent: 675000,
      loyaltyPoints: 1350,
      preferredProduct: "Arena Premium 10kg",
      status: "VIP",
      channel: "WhatsApp",
      catName: "Pelusa"
    },
    {
      id: 2,
      name: "Carlos Ramírez", 
      email: "carlos.ramirez@hotmail.com",
      phone: "+57 315 987 6543",
      city: "Medellín",
      registrationDate: "2024-01-08",
      lastOrder: "2024-01-14",
      totalOrders: 3,
      totalSpent: 135000,
      loyaltyPoints: 270,
      preferredProduct: "Arena Antibacterial 5kg",
      status: "Activo",
      channel: "Instagram",
      catName: "Michi"
    },
    {
      id: 3,
      name: "Laura Martínez",
      email: "laura.martinez@yahoo.com",
      phone: "+57 301 456 7890",
      city: "Cali",
      registrationDate: "2023-08-22",
      lastOrder: "2024-01-10",
      totalOrders: 28,
      totalSpent: 1260000,
      loyaltyPoints: 2520,
      preferredProduct: "Arena Perfumada 15kg",
      status: "VIP",
      channel: "Facebook",
      catName: "Luna y Sol"
    },
    {
      id: 4,
      name: "Andrés Torres",
      email: "andres.torres@gmail.com", 
      phone: "+57 304 234 5678",
      city: "Barranquilla",
      registrationDate: "2023-12-03",
      lastOrder: "2023-12-28",
      totalOrders: 8,
      totalSpent: 288000,
      loyaltyPoints: 576,
      preferredProduct: "Arena Básica 8kg",
      status: "Inactivo",
      channel: "WhatsApp",
      catName: "Garfield"
    },
    {
      id: 5,
      name: "Patricia Herrera",
      email: "patricia.herrera@outlook.com",
      phone: "+57 318 345 6789",
      city: "Cartagena",
      registrationDate: "2024-01-05",
      lastOrder: "2024-01-13",
      totalOrders: 5,
      totalSpent: 225000,
      loyaltyPoints: 450,
      preferredProduct: "Arena Ultra 12kg",
      status: "Activo",
      channel: "Instagram",
      catName: "Nala"
    },
    {
      id: 6,
      name: "Roberto Silva",
      email: "roberto.silva@gmail.com",
      phone: "+57 312 567 8901",
      city: "Bucaramanga",
      registrationDate: "2023-09-18",
      lastOrder: "2024-01-11",
      totalOrders: 22,
      totalSpent: 990000,
      loyaltyPoints: 1980,
      preferredProduct: "Arena Premium 10kg",
      status: "Premium",
      channel: "WhatsApp",
      catName: "Simba y Nemo"
    },
    // Agregar más clientes para demostrar paginación
    ...Array.from({ length: 50 }, (_, i) => {
      const names = ['Ana', 'Luis', 'Carmen', 'Diego', 'Elena', 'Fernando', 'Gabriela', 'Héctor'];
      const lastNames = ['Pérez', 'López', 'García', 'Rodríguez', 'Martín', 'Hernández', 'Ruiz', 'Vargas'];
      const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira'];
      const channels = ['WhatsApp', 'Instagram', 'Facebook'];
      const products = ['Arena Premium 10kg', 'Arena Antibacterial 5kg', 'Arena Perfumada 15kg', 'Arena Básica 8kg'];
      const catNames = ['Misu', 'Felix', 'Salem', 'Coco', 'Milo', 'Nina', 'Oreo', 'Zara'];
      
      const totalOrders = Math.floor(Math.random() * 30 + 1);
      const totalSpent = totalOrders * (Math.floor(Math.random() * 50000) + 15000);
      
      return {
        id: 7 + i,
        name: `${names[i % names.length]} ${lastNames[i % lastNames.length]}`,
        email: `${names[i % names.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@gmail.com`,
        phone: `+57 ${300 + Math.floor(Math.random() * 20)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        city: cities[i % cities.length],
        registrationDate: "2023-12-01",
        lastOrder: "2024-01-10",
        totalOrders,
        totalSpent,
        loyaltyPoints: totalSpent / 500,
        preferredProduct: products[i % products.length],
        status: totalSpent > 500000 ? "VIP" : totalSpent > 200000 ? "Premium" : "Activo",
        channel: channels[i % channels.length],
        catName: catNames[i % catNames.length]
      };
    })
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "VIP": "bg-primary text-primary-foreground",
      "Premium": "bg-warning text-warning-foreground",
      "Activo": "bg-success text-success-foreground",
      "Inactivo": "bg-secondary text-secondary-foreground"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors]}>{status}</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      "WhatsApp": "💬",
      "Instagram": "📷", 
      "Facebook": "👥"
    };
    return icons[channel] || "📱";
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.catName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Base de datos de clientes Miau Miau y programa de lealtad
          </p>
        </div>
        <Button className="gap-2">
          <UserCheck className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>
            Información completa de clientes, historial de compras y programa de lealtad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes por nombre, email, teléfono, ciudad o mascota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Historial</TableHead>
                  <TableHead>Lealtad</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.city}</TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{customer.totalOrders} pedidos</div>
                        <div className="text-xs text-muted-foreground">
                          ${customer.totalSpent.toLocaleString('es-CO')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Último: {customer.lastOrder}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-medium text-sm">{customer.loyaltyPoints.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">🐱 {customer.catName}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.preferredProduct}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getChannelIcon(customer.channel)}</span>
                        <span className="text-sm">{customer.channel}</span>
                      </div>
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
                            Editar Cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar Mensaje
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="mr-2 h-4 w-4" />
                            Gestionar Puntos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Ver Historial
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length} clientes
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
    </div>
  );
};

export default Customers;