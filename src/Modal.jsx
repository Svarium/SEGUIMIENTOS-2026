import React from "react";

function Modal({ isOpen, title, onClose, children, footer, size = "md" }) {
  if (!isOpen) return null;

  const sizeClass =
    size === "lg" ? "modal-lg" : size === "sm" ? "modal-sm" : "modal-md";

  return (
    <div className="modal-backdrop">
      <div className={`modal-shell ${sizeClass}`}>
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}

export default Modal;

