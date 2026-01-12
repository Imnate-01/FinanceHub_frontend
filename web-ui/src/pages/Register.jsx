import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Mail, CreditCard, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import { register } from "../api/auth"; // 👈 NUEVO

export default function Register() {
  const nav = useNavigate();
  const [formData, setFormData] = useState({ name: "", curp: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const curp = formData.curp.trim();
      const password = formData.password;

      // Validaciones mínimas (ajústalas si quieres)
      if (curp.length < 10) throw new Error("CURP inválida.");
      if (password.length < 4) throw new Error("La contraseña debe tener al menos 4 caracteres.");

      // ✅ IMPORTANTE: la BD solo tiene curp y password_hash
      // Por eso mandamos SOLO curp + password (en texto plano).
      await register(curp, password);

      nav("/login");
    } catch (err) {
      setError(err?.message || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Únete a FinanceHub y toma el control."
      footer={
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-600"
        >
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-blue-600 hover:text-blue-700 transition-colors" to="/login">
            Inicia sesión
          </Link>
        </motion.p>
      }
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <motion.div variants={itemVariants}>
          <TextField
            label="Nombre Completo (opcional)"
            name="name"
            icon={<User size={18} />}
            placeholder="Juan Pérez"
            value={formData.name}
            onChange={handleChange}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="CURP"
            name="curp"
            icon={<CreditCard size={18} />}
            placeholder="AAAA000000HDFXXX00"
            value={formData.curp}
            onChange={handleChange}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Correo Electrónico (opcional)"
            name="email"
            type="email"
            icon={<Mail size={18} />}
            placeholder="juan@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            icon={<Lock size={18} />}
            placeholder="Crear contraseña segura"
            value={formData.password}
            onChange={handleChange}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Creando...
              </>
            ) : (
              <>
                Registrarse Gratis <ArrowRight size={18} className="opacity-70" />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
}
