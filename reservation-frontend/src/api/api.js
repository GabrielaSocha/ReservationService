const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:7215";

function getToken() {
    return localStorage.getItem("token") || "";
}

async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include", 
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            (typeof data === "string" ? data : null) ||
            `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export const api = {
    login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
    register: (email, password) => request("/api/auth/register", { method: "POST", body: { email, password } }),
    me: () => request("/api/auth/me", { auth: true }),

    availabilityByTable: ({ date, partySize, durationMinutes }) => {
        const qs = new URLSearchParams({
            date,
            partySize: String(partySize),
            durationMinutes: String(durationMinutes),
        });
        return request(`/api/availability/by-table?${qs.toString()}`, { auth: false });
    },

    createReservation: (dto) => request("/api/reservations", { method: "POST", body: dto, auth: true }),
    myReservations: () => request("/api/reservations", { auth: true }),
    cancelReservation: (id) => request(`/api/reservations/${id}`, { method: "DELETE", auth: true }),
    getTables: () => request("/api/tables", { auth: true }),
    hardDeleteReservation: (id) =>
        request(`/api/reservations/${id}/hard`, { method: "DELETE", auth: true }),
    updateReservation: (id, dto) =>
        request(`/api/reservations/${id}`, { method: "PUT", body: dto, auth: true }),

};
