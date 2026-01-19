import React, { useEffect, useMemo, useState } from "react";
import ToastHost from "../components/ToastHost.jsx";
import { useAuth } from "../auth/useAuth.js";
import { api } from "../api/api.js";

// pomoc: datetime-local bez strefy, z sekundami (backend lubi ISO bez "Z")
function toLocalNoTZWithSeconds(dtLocalValue) {
    // dtLocalValue: "YYYY-MM-DDTHH:mm" albo "YYYY-MM-DDTHH:mm:ss"
    if (!dtLocalValue) return "";
    return dtLocalValue.length === 16 ? `${dtLocalValue}:00` : dtLocalValue;
}

function addMinutesToDtLocal(dtLocalValue, minutes) {
    if (!dtLocalValue) return "";
    const d = new Date(dtLocalValue);
    d.setMinutes(d.getMinutes() + Number(minutes || 0));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function RaceTest() {
    const { token, isAdmin, isAuthed } = useAuth();

    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);

    const [tables, setTables] = useState([]);
    const [tableId, setTableId] = useState("");

    // domyślnie: dziś 12:00
    const [startAtLocal, setStartAtLocal] = useState(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}T12:00`;
    });

    const [durationMinutes, setDurationMinutes] = useState(60);
    const [attempts, setAttempts] = useState(50);
    const [prefix, setPrefix] = useState("RaceUser");

    const endAtLocal = useMemo(
        () => addMinutesToDtLocal(startAtLocal, durationMinutes),
        [startAtLocal, durationMinutes]
    );

    const [result, setResult] = useState(null);

    async function loadTables() {
        try {
            const t = await api.getTables();
            setTables(Array.isArray(t) ? t : []);
            // auto-wybór pierwszego stolika
            if (!tableId && Array.isArray(t) && t.length > 0) setTableId(t[0].id);
        } catch (e) {
            setToast({ type: "danger", title: "Błąd", message: e.message });
        }
    }

    useEffect(() => {
        if (!isAuthed) return;
        loadTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed]);

    async function runRace() {
        if (!isAuthed) {
            setToast({ type: "warning", title: "Brak logowania", message: "Zaloguj się jako Admin." });
            return;
        }
        if (!isAdmin) {
            setToast({ type: "danger", title: "Brak uprawnień", message: "Endpoint jest tylko dla Admina." });
            return;
        }
        if (!tableId) {
            setToast({ type: "warning", title: "Brak stolika", message: "Wybierz stolik." });
            return;
        }

        const startAt = toLocalNoTZWithSeconds(startAtLocal);
        const endAt = toLocalNoTZWithSeconds(endAtLocal);

        setLoading(true);
        setResult(null);
        setToast(null);

        try {
            const base = import.meta.env.VITE_API_BASE || "http://localhost:7215";


            const resp = await fetch(`${base}/api/tests/race`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tableId,
                    startAt,
                    endAt,
                    attempts: Number(attempts),
                    customerNamePrefix: prefix,
                }),
            });

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(txt || `HTTP ${resp.status}`);
            }

            const data = await resp.json();
            setResult(data);

            setToast({
                type: "success",
                title: "Race test wykonany",
                message: `success=${data.success}, conflicts=${data.conflicts}, otherFails=${data.otherFails}`,
            });
        } catch (e) {
            setToast({ type: "danger", title: "Błąd", message: e.message });
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthed) {
        return (
            <div className="container py-4 text-white">
                <div className="alert alert-warning">
                    Zaloguj się, aby wejść w RaceTest.
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container py-4 text-white">
                <div className="alert alert-danger">
                    Ta strona jest dostępna tylko dla Admina.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4 text-white">
            <ToastHost toast={toast} onClose={() => setToast(null)} />

            <div className="p-4 rounded-4 card-soft">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h4 className="mb-0">RaceTest (Admin)</h4>
                    <button className="btn btn-outline-light" onClick={loadTables} disabled={loading}>
                        Odśwież stoliki
                    </button>
                </div>

                <div className="row g-3 mt-2">
                    <div className="col-lg-4">
                        <label className="form-label">Stolik</label>
                        <select className="form-select" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                            {tables.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.seats} miejsc)
                                </option>
                            ))}
                        </select>
                        <div className="small opacity-75 mt-1">
                            Endpoint rezerwuje równolegle ten sam slot, żeby sprawdzić lock/idempotencję.
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <label className="form-label">Start (lokalnie)</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={startAtLocal}
                            onChange={(e) => setStartAtLocal(e.target.value)}
                        />
                    </div>

                    <div className="col-lg-4">
                        <label className="form-label">Czas (min)</label>
                        <select
                            className="form-select"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        >
                            {[15, 30, 45, 60, 75, 90, 120].map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>

                        <div className="small opacity-75 mt-1">
                            Koniec zostanie ustawiony automatycznie: <b>{endAtLocal}</b>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <label className="form-label">Attempts</label>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            className="form-control"
                            value={attempts}
                            onChange={(e) => setAttempts(Number(e.target.value))}
                        />
                    </div>

                    <div className="col-lg-4">
                        <label className="form-label">Customer prefix</label>
                        <input className="form-control" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                    </div>

                    <div className="col-lg-4 d-flex align-items-end">
                        <button className="btn btn-danger w-100" onClick={runRace} disabled={loading}>
                            {loading ? "Uruchamiam..." : "Uruchom RaceTest"}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="mt-4">
                        <h5>Wynik</h5>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <div className="p-3 rounded-4 border border-secondary">
                                    <div className="small opacity-75">Attempts</div>
                                    <div className="fs-4 fw-bold">{result.attempts}</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3 rounded-4 border border-secondary">
                                    <div className="small opacity-75">Success</div>
                                    <div className="fs-4 fw-bold">{result.success}</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3 rounded-4 border border-secondary">
                                    <div className="small opacity-75">Conflicts</div>
                                    <div className="fs-4 fw-bold">{result.conflicts}</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="p-3 rounded-4 border border-secondary">
                                    <div className="small opacity-75">Other fails</div>
                                    <div className="fs-4 fw-bold">{result.otherFails}</div>
                                </div>
                            </div>
                        </div>

                        {!!result.sample?.length && (
                            <div className="mt-3">
                                <div className="small opacity-75 mb-2">Sample (pierwsze 10)</div>
                                <div className="table-responsive">
                                    <table className="table table-dark table-striped align-middle">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>ok</th>
                                                <th>message</th>
                                                <th>reservationId</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.sample.map((x, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{String(x.ok)}</td>
                                                    <td style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {x.message}
                                                    </td>
                                                    <td className="small opacity-75">{x.reservationId || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
