import React, { useState } from "react";
import { useAuth } from "../auth/useAuth.js";


export default function AuthModal({ show, onClose }) {
    const { login, register, loading } = useAuth();
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("admin@local");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState("");

    if (!show) return null;

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        try {
            if (mode === "login") await login(email, password);
            else await register(email, password);
            onClose();
        } catch (err) {
            setError(err.message || "Błąd logowania");
        }
    }

    return (
        <>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content card-soft text-white">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
                            </h5>
                            <button className="btn-close btn-close-white" onClick={onClose}></button>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}

                                <label className="form-label">Email</label>
                                <input className="form-control mb-3" onChange={(e) => setEmail(e.target.value)} />

                                <label className="form-label">Hasło</label>
                                <input type="password" className="form-control" onChange={(e) => setPassword(e.target.value)} />

                                <div className="mt-3 small opacity-75">
                                    Backend oczekuje JWT w headerze Authorization.
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-light" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                                    {mode === "login" ? "Nie mam konta" : "Mam konto"}
                                </button>
                                <button className="btn btn-primary" disabled={loading}>
                                    {loading ? "..." : (mode === "login" ? "Zaloguj" : "Zarejestruj")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop show"></div>
        </>
    );
}
