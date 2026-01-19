import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Navbar({ onOpenAuth }) {
    const { isAuthed, isAdmin, logout } = useAuth();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
            <div className="container">
                <Link className="navbar-brand" to="/">ReservationService</Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div id="nav" className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto gap-2">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">Start</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/reservations">Rezerwacje</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/my">Moje</NavLink>
                        </li>
                        {isAdmin && (
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/racetest">RaceTest</NavLink>
                            </li>
                        )}

                    </ul>

                    <div className="d-flex gap-2 align-items-center">
                        {isAdmin && <span className="badge text-bg-warning">Admin</span>}
                        {!isAuthed ? (
                            <button className="btn btn-outline-light" onClick={onOpenAuth}>Zaloguj</button>
                        ) : (
                            <button className="btn btn-outline-light" onClick={logout}>Wyloguj</button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
