"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-th-void/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-fade-up relative w-full max-w-md rounded-2xl bg-th-canvas p-6 ring-1 ring-th-dusty/50">
        {title && (
          <h2 className="mb-2 text-lg font-semibold text-th-ink">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
