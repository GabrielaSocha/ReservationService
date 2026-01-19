import React from "react";

export default function ToastHost({ toast, onClose }) {
    if (!toast) return null;

    const bg =
        toast.type === "success" ? "bg-success" :
            toast.type === "warning" ? "bg-warning text-dark" :
                "bg-danger";

    return (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
            <div className={`toast show ${bg}`}>
                <div className="toast-header">
                    <strong className="me-auto">{toast.title || "Info"}</strong>
                    <button className="btn-close" onClick={onClose}></button>
                </div>
                <div className="toast-body">{toast.message}</div>
            </div>
        </div>
    );
}
