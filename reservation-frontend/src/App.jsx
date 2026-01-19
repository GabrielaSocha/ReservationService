import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import Home from "./pages/Home.jsx";
import Reservations from "./pages/Reservations.jsx";
import MyReservations from "./pages/MyReservations.jsx";
import RaceTest from "./pages/RaceTest.jsx";


export default function App() {
    const [showAuth, setShowAuth] = useState(false);

    return (
        <>
            <Navbar onOpenAuth={() => setShowAuth(true)} />
            <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/my" element={<MyReservations />} />
                <Route path="/racetest" element={<RaceTest />} />

            </Routes>
        </>
    );
}
