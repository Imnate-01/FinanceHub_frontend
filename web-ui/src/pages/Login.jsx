import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import { login } from "../api/auth";
import { adminApi } from "../api/admin";

export default function Login() {
  const nav = useNavigate();
  const [curp, setCurp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(curp.trim(), password);

      // 🔐 1. Obtener token (acepta varios formatos)
      const rawToken =
        data?.token ||
        data?.access_token ||
        data?.jwt ||
        data?.data?.token ||
        (typeof data === "string" ? data : null);

      if (!rawToken) {
        console.log("Respuesta login (sin token):", data);
        throw new Error("Respuesta inválida: falta token");
      }

      // ⏱️ 2. Guardar token y metadata
      const expires = data?.expires_in ?? data?.expiresIn ?? data?.exp ?? 3600;

      sessionStorage.setItem("jwt", rawToken);
      sessionStorage.setItem("expires_in", String(expires));
      sessionStorage.setItem("login_at", String(Date.now()));

      // 👑 3. Detectar ROLE si viene del backend
      const role =
        data?.role ||
        data?.user?.role ||
        data?.data?.role ||
        data?.data?.user?.role ||
        null;

      // 🟢 CASO A: el backend SÍ envía el role
      if (role) {
        sessionStorage.setItem("role", role);

        if (role === "ADMIN") {
          nav("/admin");      // 👑 ADMIN → Dashboard Admin
        } else {
          nav("/dashboard");  // 👤 USER → Dashboard Usuario
        }
        return;
      }

      // 🟡 CASO B: el backend NO envía role → fallback
      try {
        // probamos un endpoint admin
        await adminApi.getTotalMoney();

        // si responde 200, ES ADMIN
        sessionStorage.setItem("role", "ADMIN");
        nav("/admin");
      } catch {
        // si responde 401/403, NO es admin
        sessionStorage.setItem("role", "USER");
        nav("/dashboard");
      }
    } catch (err) {
      const msg = err?.message || "No se pudo iniciar sesión";

      if (msg.includes("401")) setError("CURP o contraseña incorrectos.");
      else if (msg.toLowerCase().includes("cors"))
        setError("El servidor bloqueó la petición (CORS).");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  /* --- UI original intacta --- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa tus credenciales para acceder a tu banca."
      footer={
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-600"
        >
          ¿Aún no tienes cuenta?{" "}
          <Link
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            to="/register"
          >
            Regístrate gratis
          </Link>
        </motion.p>
      }
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={onSubmit}
        className="space-y-5"
      >
        <motion.div variants={itemVariants}>
          <TextField
            label="CURP"
            name="curp"
            icon={<User size={18} />}
            value={curp}
            onChange={(e) => setCurp(e.target.value)}
            placeholder="AAAA000000HDFXXX00"
            autoComplete="username"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Entrando...
              </>
            ) : (
              <>
                Ingresar <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
}
