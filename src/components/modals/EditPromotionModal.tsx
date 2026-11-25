import CreatePromotionModal from "./CreatePromotionModal";
import type { Promotion } from "@/services/promotionsService";

interface EditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion: Promotion;
}

const EditPromotionModal = ({ isOpen, onClose, onSuccess, promotion }: EditPromotionModalProps) => (
  <CreatePromotionModal
    isOpen={isOpen}
    onClose={onClose}
    onSuccess={onSuccess}
    promotion={promotion}
  />
);

export default EditPromotionModal;
