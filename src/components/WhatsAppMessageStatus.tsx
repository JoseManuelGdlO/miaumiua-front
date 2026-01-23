import { Check, CheckCheck, Clock, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type WhatsAppStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | null | undefined;

interface WhatsAppMessageStatusProps {
  status: WhatsAppStatus;
  className?: string;
}

const WhatsAppMessageStatus = ({ status, className = '' }: WhatsAppMessageStatusProps) => {
  if (!status || status === null || status === undefined) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-gray-400',
          tooltip: 'Mensaje pendiente de envío'
        };
      case 'sent':
        return {
          icon: Check,
          color: 'text-blue-400',
          tooltip: 'Mensaje enviado'
        };
      case 'delivered':
        return {
          icon: CheckCheck,
          color: 'text-gray-400',
          tooltip: 'Mensaje entregado'
        };
      case 'read':
        return {
          icon: CheckCheck,
          color: 'text-blue-400',
          tooltip: 'Mensaje leído'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-400',
          tooltip: 'Error al enviar mensaje'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${config.color} ${className}`}>
            <Icon className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WhatsAppMessageStatus;
