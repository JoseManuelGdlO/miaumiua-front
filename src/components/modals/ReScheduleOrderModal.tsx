import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReScheduleOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: {
    id: number;
    orderNumber: string;
    customer: string;
    phone: string;
    address: string;
    city: string;
    zone: string;
    products: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    originalDate: string;
    cancelReason?: string;
  } | null;
}

const ReScheduleOrderModal = ({ open, onOpenChange, order }: ReScheduleOrderModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    newDeliveryDate: undefined as Date | undefined,
    newTimeSlot: "",
    rescheduleReason: "",
    rescheduledBy: "",
    customerNotified: false,
    urgentDelivery: false,
    newComments: "",
    newPaymentMethod: ""
  });

  const timeSlots = [
    "8:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM", 
    "12:00 PM - 2:00 PM",
    "2:00 PM - 4:00 PM",
    "4:00 PM - 6:00 PM",
    "6:00 PM - 8:00 PM"
  ];

  const users = [
    "Ana García (Administrador)",
    "Carlos Mendoza (Supervisor Ventas)",
    "Laura Rodríguez (Agente Chat)",
    "Miguel Torres (Inventario)",
    "Sofia Valencia (Agente Chat)",
    "Diego Morales (Supervisor Técnico)"
  ];

  const paymentMethods = [
    "Efectivo",
    "Tarjeta de Crédito",
    "Tarjeta Débito", 
    "Transferencia Bancaria",
    "Nequi",
    "Daviplata",
    "PSE"
  ];

  const rescheduleReasons = [
    "Cliente solicitó cambio de fecha",
    "Cliente solicitó cambio de dirección",
    "Problema de disponibilidad del cliente",
    "Error en la fecha original",
    "Reagendamiento por cancelación previa",
    "Cambio en método de pago",
    "Solicitud urgente del cliente",
    "Optimización de rutas",
    "Otro"
  ];

  // Reset form when modal opens with new order
  useEffect(() => {
    if (open && order) {
      setFormData({
        newDeliveryDate: undefined,
        newTimeSlot: "",
        rescheduleReason: "",
        rescheduledBy: "",
        customerNotified: false,
        urgentDelivery: false,
        newComments: "",
        newPaymentMethod: ""
      });
    }
  }, [open, order]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.newDeliveryDate) {
      toast({
        title: "Error",
        description: "Selecciona una nueva fecha de entrega",
        variant: "destructive"
      });
      return;
    }

    if (!formData.rescheduleReason || !formData.rescheduledBy) {
      toast({
        title: "Error",
        description: "Completa el motivo del reagendamiento y quién lo realiza",
        variant: "destructive"
      });
      return;
    }

    if (formData.newDeliveryDate <= new Date()) {
      toast({
        title: "Error", 
        description: "La nueva fecha debe ser posterior a hoy",
        variant: "destructive"
      });
      return;
    }

    const rescheduleData = {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      ...formData,
      rescheduleDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      newStatus: formData.urgentDelivery ? "Urgente" : "Programado"
    };

    console.log("Reagendando pedido:", rescheduleData);

    toast({
      title: "Pedido reagendado",
      description: `${order?.orderNumber} reagendado para ${format(formData.newDeliveryDate, "PPP")}`,
    });

    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reagendar Pedido Cancelado
          </DialogTitle>
          <DialogDescription>
            Reagenda el pedido {order.orderNumber} para una nueva fecha de entrega
          </DialogDescription>
        </DialogHeader>

        {/* Información del Pedido Original */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Información del Pedido Original
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span> {order.customer}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {order.phone}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Dirección:</span> {order.address}, {order.city} - {order.zone}
              </div>
              <div>
                <span className="font-medium">Fecha Original:</span> {order.originalDate}
              </div>
              <div>
                <span className="font-medium">Total:</span> ${order.total.toLocaleString('es-CO')}
              </div>
            </div>
            
            <div className="mt-3">
              <span className="font-medium text-sm">Productos:</span>
              <div className="mt-1 space-y-1">
                {order.products.map((product, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {product.quantity}x {product.name} - ${(product.quantity * product.price).toLocaleString('es-CO')}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nueva Fecha de Entrega *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.newDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.newDeliveryDate ? format(formData.newDeliveryDate, "PPP") : "Seleccionar nueva fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.newDeliveryDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, newDeliveryDate: date }))}
                      disabled={(date) => date <= new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Franja Horaria Preferida</Label>
                <Select value={formData.newTimeSlot} onValueChange={(value) => setFormData(prev => ({ ...prev, newTimeSlot: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Motivo del Reagendamiento *</Label>
                <Select value={formData.rescheduleReason} onValueChange={(value) => setFormData(prev => ({ ...prev, rescheduleReason: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {rescheduleReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reagendado por *</Label>
                <Select value={formData.rescheduledBy} onValueChange={(value) => setFormData(prev => ({ ...prev, rescheduledBy: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user} value={user}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cambiar Método de Pago</Label>
              <Select value={formData.newPaymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, newPaymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Mantener método actual o cambiar" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newComments">Comentarios Adicionales</Label>
              <Textarea
                id="newComments"
                value={formData.newComments}
                onChange={(e) => setFormData(prev => ({ ...prev, newComments: e.target.value }))}
                placeholder="Instrucciones especiales para la nueva entrega..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.urgentDelivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgentDelivery: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Marcar como entrega urgente</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerNotified}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerNotified: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Cliente ya fue notificado</span>
              </label>
            </div>

            {formData.urgentDelivery && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertCircle className="h-4 w-4" />
                  Entrega Urgente
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este pedido será marcado como urgente y tendrá prioridad en la asignación de rutas.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Reagendar Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReScheduleOrderModal;