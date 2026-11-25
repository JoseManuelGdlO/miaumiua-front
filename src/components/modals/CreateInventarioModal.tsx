import InventarioFormModal from "@/components/modals/InventarioFormModal";

interface CreateInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInventarioModal = (props: CreateInventarioModalProps) => (
  <InventarioFormModal {...props} />
);

export default CreateInventarioModal;
