import { Modal } from "./Modal";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} showClose={false}>
      <p className="text-sm text-ink-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
