import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api.js";
import { AuthCtx } from "./authContext.js";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token") || "");
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(false);

    async function refreshMe(nextToken = token) {
        if (!nextToken) {
            setMe(null);
            return;
        }
        try {
            const data = await api.me();
            setMe(data);
        } catch {
            setMe(null);
            setToken("");
            localStorage.removeItem("token");
        }
    }

    async function login(email, password) {
        setLoading(true);
        try {
            const data = await api.login(email, password);
            const t = data?.token || data?.accessToken || data?.jwt;
            if (!t) throw new Error("Brak tokena w odpowiedzi /api/auth/login");

            setToken(t);
            localStorage.setItem("token", t);
            await refreshMe(t);
        } finally {
            setLoading(false);
        }
    }


    async function register(email, password) {
        setLoading(true);
        try {
            await api.register(email, password);

            const data = await api.login(email, password);

            const t = data?.token || data?.accessToken || data?.jwt;
            if (!t) throw new Error("Brak tokena w odpowiedzi /api/auth/login");

            setToken(t);
            localStorage.setItem("token", t);
            await refreshMe(t);
        } finally {
            setLoading(false);
        }
    }


    function logout() {
        setToken("");
        setMe(null);
        localStorage.removeItem("token");
    }

    useEffect(() => {
        refreshMe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const value = useMemo(
        () => ({
            token,
            me,
            loading,
            login,
            register,
            logout,
            isAuthed: !!token,
            isAdmin: Array.isArray(me?.roles)
                ? me.roles.includes("Admin")
                : false,
        }),
        [token, me, loading]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
