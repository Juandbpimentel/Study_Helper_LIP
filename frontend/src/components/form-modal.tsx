"use client";

import { FormEventHandler, ReactNode } from "react";
import { BaseModal } from "./base-modal";

type FormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
};

export function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
}: FormModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} title={title}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          // Ensure the modal form never triggers a full page reload.
          e.preventDefault();
          onSubmit(e);
        }}
      >
        {children}
        <div className="mt-6 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="ui-btn-cancel">
            {cancelLabel}
          </button>
          <button type="submit" className="ui-btn-primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
