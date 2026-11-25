import InventarioFormModal from "@/components/modals/InventarioFormModal";
import { Inventario } from "@/services/inventariosService";

interface EditInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventario: Inventario;
}

const EditInventarioModal = ({ inventario, ...props }: EditInventarioModalProps) => (
  <InventarioFormModal inventario={inventario} {...props} />
);

export default EditInventarioModal;
