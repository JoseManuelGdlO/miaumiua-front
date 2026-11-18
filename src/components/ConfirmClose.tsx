import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function formDirty(current: unknown, initial: unknown) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

export function useConfirmClose(close: () => void, dirty: boolean, blocked = false) {
  const [ask, setAsk] = useState(false);
  const confirm = () => {
    setAsk(false);
    close();
  };
  const requestClose = () => {
    if (blocked) return;
    if (dirty) setAsk(true);
    else confirm();
  };
  const onOpenChange = (next: boolean) => {
    if (!next) requestClose();
  };
  return { ask, setAsk, requestClose, confirm, onOpenChange };
}

export function ConfirmCloseDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres salir?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir editando</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Salir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
