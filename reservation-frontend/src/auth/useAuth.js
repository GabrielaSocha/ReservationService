import { useContext } from "react";
import { AuthCtx } from "./authContext.js";

export function useAuth() {
    return useContext(AuthCtx);
}
