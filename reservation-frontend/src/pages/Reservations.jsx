import React, { useMemo, useState } from "react";
import { api } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import ToastHost from "../components/ToastHost.jsx";
import { fmtTime, yyyyMmDd } from "../utils/time.js";
import { v4 as uuid } from "uuid";

export default function Reservations() {
    const { isAuthed } = useAuth();

    const [date, setDate] = useState(yyyyMmDd());
    const [partySize, setPartySize] = useState(2);
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState(null);
    const [customerName, setCustomerName] = useState("Jan Kowalski");

    const [selected, setSelected] = useState({}); 
    const [toast, setToast] = useState(null);

    const durations = [30, 45, 60, 75, 90, 120];

    const canCheck = !!date && partySize > 0 && durationMinutes > 0;

    async function check() {
        if (!canCheck) return;

        setLoading(true);

        setToast((prev) => (prev?.type === "success" ? prev : null));

        try {
            const data = await api.availabilityByTable({ date, partySize, durationMinutes });
            setAvailability(data);
            setSelected({});
        } catch (e) {
            setAvailability(null);
            setToast({ type: "danger", title: "Błąd", message: e?.message ?? "Nieznany błąd" });
        } finally {
            setLoading(false);
        }
    }

    async function reserve(tableId) {
        if (!isAuthed) {
            setToast({ type: "warning", title: "Brak logowania", message: "Zaloguj się, aby zarezerwować." });
            return;
        }

        const table = availability?.tables?.find((t) => t.id === tableId);
        const slotStart = selected[tableId];
        const slot = table?.slots?.find((s) => s.start === slotStart);

        if (!slot) {
            setToast({ type: "warning", title: "Wybierz godzinę", message: "Najpierw wybierz slot z listy." });
            return;
        }

        try {
            const dto = {
                tableId,
                startAt: slot.start,
                endAt: slot.end,
                customerName,
                idempotencyKey: uuid(),
            };

            await api.createReservation(dto);

            setToast({
                type: "success",
                title: "Zarezerwowano",
                message: `Stolik ${table.name} o ${fmtTime(slot.start)}.`,
            });

            setTimeout(() => {
                setToast((prev) => (prev?.type === "success" ? null : prev));
            }, 3000);

            setTimeout(() => {
                check().catch(() => { });
            }, 600);

        } catch (e) {
            setToast({ type: "danger", title: "Nie udało się", message: e?.message ?? "Nieznany błąd" });
        }
    }

    const tables = useMemo(() => availability?.tables ?? [], [availability]);

    return (
        <div className="container py-4 text-white">
            <ToastHost toast={toast} onClose={() => setToast(null)} />

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="p-4 rounded-4 card-soft">
                        <h4 className="mb-3">Sprawdź dostępność</h4>

                        <label className="form-label">Dzień</label>
                        <input type="date" className="form-control mb-3" value={date} onChange={(e) => setDate(e.target.value)} />

                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label">Liczba osób</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    value={partySize}
                                    onChange={(e) => setPartySize(Number(e.target.value))}
                                />
                            </div>
                            <div className="col-6">
                                <label className="form-label">Czas (min)</label>
                                <select className="form-select" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}>
                                    {durations.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label className="form-label mt-3">Imię i nazwisko (do rezerwacji)</label>
                        <input className="form-control mb-3" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

                        <button className="btn btn-primary w-100" onClick={check} disabled={!canCheck || loading}>
                            {loading ? "Sprawdzam..." : "Sprawdź"}
                        </button>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="p-4 rounded-4 card-soft">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <h4 className="mb-0">Dostępne stoliki</h4>
                            {!isAuthed && <span className="badge text-bg-secondary">Zaloguj się, aby rezerwować</span>}
                        </div>

                        {!availability && (
                            <div className="alert alert-secondary mb-0">
                                Kliknij <b>Sprawdź</b>, aby pobrać dostępne stoliki.
                            </div>
                        )}

                        {availability && tables.length === 0 && (
                            <div className="alert alert-warning mb-0">
                                Brak wolnych stolików dla: <b>{partySize}</b> osób, <b>{durationMinutes}</b> min.
                            </div>
                        )}

                        {tables.length > 0 && (
                            <div className="mt-3 d-flex flex-column gap-3">
                                {tables.map((t) => (
                                    <div key={t.id} className="p-3 rounded-4 border border-secondary">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div>
                                                <div className="fw-bold">{t.name}</div>
                                                <div className="small opacity-75">{t.seats} miejsc</div>
                                            </div>

                                            <div className="d-flex gap-2 align-items-center">
                                                <select
                                                    className="form-select"
                                                    style={{ minWidth: 200 }}
                                                    value={selected[t.id] || ""}
                                                    onChange={(e) => setSelected((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                                >
                                                    <option value="">Wybierz godzinę</option>
                                                    {t.slots.map((s) => (
                                                        <option key={s.start} value={s.start}>
                                                            {fmtTime(s.start)} – {fmtTime(s.end)}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button className="btn btn-success" onClick={() => reserve(t.id)}>
                                                    Rezerwuj
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
