import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem("jwt");
  const role = sessionStorage.getItem("role"); // "ADMIN" si lo guardas
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      // 1) sin token -> no pasa
      if (!token) {
        if (alive) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      // 2) si ya guardaste role y es ADMIN -> pasa directo
      if (role === "ADMIN") {
        if (alive) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      // 3) fallback: probar un endpoint admin (si responde OK, eres admin)
      try {
        await adminApi.getTotalMoney();
        if (alive) setAllowed(true);
      } catch (e) {
        if (alive) setAllowed(false);
      } finally {
        if (alive) setChecking(false);
      }
    }

    check();
    return () => { alive = false; };
  }, [token, role]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          Verificando permisos de admin...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
