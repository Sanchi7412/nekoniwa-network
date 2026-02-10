"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 p-0 m-auto bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm max-w-3xl w-full max-h-[90vh] rounded-xl shadow-2xl"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="bg-zinc-950 flex flex-col max-h-[90vh] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-zinc-50">{children}</div>
      </div>
    </dialog>
  );
}
