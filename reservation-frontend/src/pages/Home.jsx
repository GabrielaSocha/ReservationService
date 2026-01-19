import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="container py-5 text-white">
            <div className="row align-items-center g-4">
                <div className="col-lg-7">
                    <h1 className="display-5 fw-bold">Rezerwacje stolików</h1>
                    <p className="lead opacity-75">
                        Sprawdź dostępność stolików i zarezerwuj miejsce w godzinach 12:00–22:00.
                    </p>
                    <Link className="btn btn-primary btn-lg" to="/reservations">Przejdź do rezerwacji</Link>
                </div>
                <div className="col-lg-5">
                    <div className="p-4 rounded-4 card-soft">
                        <h5 className="mb-2">Jak to działa?</h5>
                        <ol className="opacity-75 mb-0">
                            <li>Wybierasz dzień, liczbę osób i czas (np. 60 min)</li>
                            <li>API zwraca tylko stoliki z wolnymi slotami</li>
                            <li>Wybierasz godzinę i klikasz „Rezerwuj”</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
