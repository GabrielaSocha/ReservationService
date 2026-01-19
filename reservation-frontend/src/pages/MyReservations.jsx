import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
import ToastHost from "../components/ToastHost.jsx";
import { fmtLocalDateTime } from "../utils/time.js";
import { useAuth } from "../auth/useAuth.js";

export default function MyReservations() {
    const { isAdmin } = useAuth();

    const [list, setList] = useState([]);
    const [tables, setTables] = useState([]);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    const tableNameById = useMemo(() => {
        const map = {};
        for (const t of tables || []) map[t.id] = t.name;
        return map;
    }, [tables]);

    async function load() {
        setLoading(true);
        try {
            const [resv, tbls] = await Promise.all([
                api.myReservations(),
                api.getTables().catch(() => []),
            ]);

            setList(resv || []);
            setTables(tbls || []);
        } catch (e) {
            setToast({
                type: "danger",
                title: "Błąd",
                message: e?.message ?? "Nieznany błąd",
            });
        } finally {
            setLoading(false);
        }
    }

    async function cancel(id) {
        try {
            await api.cancelReservation(id);
            setToast({ type: "success", title: "OK", message: "Rezerwacja anulowana." });
            await load();
        } catch (e) {
            setToast({
                type: "danger",
                title: "Błąd",
                message: e?.message ?? "Nieznany błąd",
            });
        }
    }

    async function hardDelete(id) {
        if (!isAdmin) return;

        const ok = confirm("Na pewno usunąć rezerwację NA STAŁE? (nie można cofnąć)");
        if (!ok) return;

        try {
            await api.hardDeleteReservation(id);
            setToast({ type: "success", title: "Usunięto", message: "Rezerwacja usunięta na stałe." });
            await load();
        } catch (e) {
            setToast({
                type: "danger",
                title: "Błąd",
                message: e?.message ?? "Nieznany błąd",
            });
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="container py-4 text-white">
            <ToastHost toast={toast} onClose={() => setToast(null)} />

            <div className="p-4 rounded-4 card-soft">
                <div className="d-flex align-items-center justify-content-between">
                    <h4 className="mb-0">Moje rezerwacje</h4>
                    <button className="btn btn-outline-light btn-sm" onClick={load} disabled={loading}>
                        Odśwież
                    </button>
                </div>

                {loading && <div className="mt-3 opacity-75">Ładowanie...</div>}

                {!loading && list.length === 0 && (
                    <div className="alert alert-secondary mt-3 mb-0">Brak rezerwacji.</div>
                )}

                {!loading && list.length > 0 && (
                    <div className="table-responsive mt-3">
                        <table className="table table-dark table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Start</th>
                                    <th>Koniec</th>
                                    <th>Stolik</th>
                                    <th>Klient</th>
                                    <th>Status</th>
                                    <th className="text-end">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((r) => {
                                    const status = String(r.status ?? "");
                                    const isCancelled = status.toLowerCase() === "cancelled";
                                    const tableLabel = tableNameById[r.tableId] ?? r.tableId;

                                    return (
                                        <tr key={r.id}>
                                            <td>{fmtLocalDateTime(r.startAt)}</td>
                                            <td>{fmtLocalDateTime(r.endAt)}</td>
                                            <td>{tableLabel}</td>
                                            <td>{r.customerName}</td>
                                            <td>{status}</td>
                                            <td className="text-end">
                                                {!isCancelled && (
                                                    <button
                                                        className="btn btn-warning btn-sm me-2"
                                                        onClick={() => cancel(r.id)}
                                                    >
                                                        Anuluj
                                                    </button>
                                                )}

                                                {isAdmin && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => hardDelete(r.id)}>
                                                        Usuń
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="small opacity-75">
                            Endpoint zwraca adminowi wszystkie, userowi tylko swoje.
                            {isAdmin ? " (Tryb admin: masz przycisk Usuń)" : ""}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
