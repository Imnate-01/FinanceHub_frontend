import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  History,
  LogOut,
  Bell,
  CreditCard,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

import { getBalance, deposit, withdraw, transfer, getLastMovements } from "../api/account";

function money(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleForMovement(m) {
  if (m.type === "DEPOSITO") return "Depósito";
  if (m.type === "RETIRO") return "Retiro";
  if (m.type === "TRANSFERENCIA") return m.direction === "IN" ? "Transferencia recibida" : "Transferencia enviada";
  return "Movimiento";
}

function subtitleForMovement(m, myCurp) {
  const o = m.origen_curp ?? "SISTEMA";
  const d = m.destino_curp ?? "SISTEMA";

  if (m.type === "DEPOSITO") return `Origen: ${o}`;
  if (m.type === "RETIRO") return `Destino: ${d}`;
  if (m.type === "TRANSFERENCIA") return m.direction === "IN" ? `De: ${o}` : `A: ${d}`;

  if (myCurp) return `${o} → ${d}`;
  return `${o} → ${d}`;
}

function Modal({ open, title, subtitle, children, onClose, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500 font-medium">{subtitle}</p>}
          </div>
          <button
            onClick={() => !busy && onClose()}
            className="rounded-xl px-3 py-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900
                   placeholder:text-slate-400 shadow-sm outline-none
                   focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export default function UserDashboard() {
  const [balance, setBalance] = useState(0);
  const [curp, setCurp] = useState("");
  const [loading, setLoading] = useState(true);

  const [loadingTx, setLoadingTx] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);

  const [monto, setMonto] = useState("");
  const [destinoCurp, setDestinoCurp] = useState("");

  const hasToken = useMemo(() => {
    const t = sessionStorage.getItem("jwt");
    return !!(t && t !== "undefined" && t !== "null" && t.trim() !== "");
  }, []);

  function resetForm() {
    setMonto("");
    setDestinoCurp("");
  }

  function closeAll() {
    setOpenDeposit(false);
    setOpenWithdraw(false);
    setOpenTransfer(false);
    resetForm();
  }

  async function refreshAll() {
    setError("");
    setLoading(true);
    setLoadingTx(true);

    try {
      const data = await getBalance(); // {curp, balance}
      const nextCurp = data.curp ?? "";
      setBalance(data.balance ?? 0);
      setCurp(nextCurp);

      const logs = await getLastMovements({ limit: 20, myCurp: nextCurp });
      setTransactions(logs);
    } catch (e) {
      setError(e?.message || "No se pudo cargar la información");
    } finally {
      setLoading(false);
      setLoadingTx(false);
    }
  }

  useEffect(() => {
    if (!hasToken) {
      setError("No hay sesión activa. Inicia sesión de nuevo.");
      setLoading(false);
      setLoadingTx(false);
      return;
    }
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDeposit() {
    setError("");
    setBusy(true);
    try {
      await deposit(monto);
      closeAll();
      await refreshAll();
    } catch (e) {
      setError(e?.message || "Error en depósito");
    } finally {
      setBusy(false);
    }
  }

  async function onWithdraw() {
    setError("");
    setBusy(true);
    try {
      await withdraw(monto);
      closeAll();
      await refreshAll();
    } catch (e) {
      setError(e?.message || "Error en retiro");
    } finally {
      setBusy(false);
    }
  }

  async function onTransfer() {
    setError("");
    setBusy(true);
    try {
      const res = await transfer(destinoCurp, monto);
      closeAll();

      setError(`Transferencia enviada: ${res?.status || "procesando"} (id: ${res?.mensaje_id || "N/A"})`);
      setTimeout(() => refreshAll(), 1200);
    } catch (e) {
      setError(e?.message || "Error en transferencia");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="bg-white px-6 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <span>FinanceHub</span>
        </div>

        <div className="flex gap-4 items-center">
          <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-lg mx-auto pt-8 px-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-between items-end"
        >
          <div>
            <p className="text-gray-500 text-sm font-medium">Hola de nuevo,</p>
            <h2 className="text-2xl font-bold text-gray-800">{curp ? curp : "Usuario"}</h2>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
            Cuenta Verificada
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
          className="relative w-full h-56 rounded-[2rem] p-8 shadow-2xl shadow-blue-500/30 overflow-hidden group cursor-default"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)" }}
        >
          <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:animate-shine transition-all duration-1000" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl border border-white/20"
          />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

          <div className="relative z-10 flex flex-col justify-between h-full text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Balance Total</p>
                <h1 className="text-4xl font-bold tracking-tight flex items-baseline gap-1">
                  <span>$</span>
                  {loading ? (
                    <span className="text-blue-100 text-2xl">Cargando…</span>
                  ) : (
                    <CountUp end={Number(balance) || 0} decimals={2} duration={1.3} separator="," />
                  )}
                </h1>
                <p className="mt-2 text-xs text-blue-100/80">{money(balance)} MXN</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAll}
                  className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-2 text-sm font-semibold"
                  title="Actualizar"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "↻"}
                </button>
                <CreditCard className="text-blue-200/80 w-8 h-8" />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setError("");
                  setOpenDeposit(true);
                }}
                className="flex-1 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/10 shadow-lg"
              >
                <ArrowDownLeft size={18} /> Depositar
              </button>
              <button
                onClick={() => {
                  setError("");
                  setOpenWithdraw(true);
                }}
                className="flex-1 bg-black/20 hover:bg-black/30 active:bg-black/40 backdrop-blur-md py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <ArrowUpRight size={18} /> Retirar
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-4 my-8">
          {[
            { icon: Send, label: "Enviar", color: "bg-blue-50 text-blue-600", onClick: () => { setError(""); setOpenTransfer(true); } },
            { icon: Wallet, label: "Pagar", color: "bg-purple-50 text-purple-600", onClick: () => setError("Aún no hay endpoint de pagos.") },
            { icon: History, label: "Historial", color: "bg-orange-50 text-orange-600", onClick: () => refreshAll() },
            { icon: CreditCard, label: "Tarjeta", color: "bg-pink-50 text-pink-600", onClick: () => setError("Aún no hay endpoint de tarjeta.") },
          ].map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
              onClick={action.onClick}
            >
              <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                <action.icon size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Movimientos recientes</h3>

        {loadingTx ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Loader2 className="animate-spin" size={18} />
            <span className="text-sm text-gray-600">Cargando movimientos…</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Aún no hay movimientos para mostrar.</p>
            <p className="text-xs text-gray-400 mt-1">
              Si acabas de operar y sigue vacío, revisa que el backend esté insertando en <b>audit_logs</b>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => {
              const isIn = tx.direction === "IN" || Number(tx.amountSigned) > 0;

              return (
                <motion.div
                  key={tx.id ?? `${index}-${tx.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isIn ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIn ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>

                    <div>
                      <p className="font-bold text-gray-800 text-sm">{titleForMovement(tx)}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {subtitleForMovement(tx, curp)} · {fmtDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  <span className={`font-bold text-base ${isIn ? "text-green-600" : "text-gray-900"}`}>
                    {Number(tx.amountSigned) > 0 ? "+" : "-"}
                    {money(Math.abs(Number(tx.amountSigned) || tx.amount || 0))} $
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Modal open={openDeposit} title="Depositar" subtitle="Agrega saldo a tu monedero." onClose={closeAll} busy={busy}>
        <div className="space-y-4">
          <Field label="Monto (MXN)" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej. 500" type="number" />
          <button
            disabled={busy}
            onClick={onDeposit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {busy ? (<><Loader2 className="animate-spin" size={18} /> Procesando…</>) : "Confirmar depósito"}
          </button>
        </div>
      </Modal>

      <Modal open={openWithdraw} title="Retirar" subtitle="Retira saldo a tu cuenta de banco." onClose={closeAll} busy={busy}>
        <div className="space-y-4">
          <Field label="Monto (MXN)" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej. 200" type="number" />
          <button
            disabled={busy}
            onClick={onWithdraw}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {busy ? (<><Loader2 className="animate-spin" size={18} /> Procesando…</>) : "Confirmar retiro"}
          </button>
        </div>
      </Modal>

      <Modal open={openTransfer} title="Enviar" subtitle="Transfiere saldo por CURP." onClose={closeAll} busy={busy}>
        <div className="space-y-4">
          <Field label="CURP destino" value={destinoCurp} onChange={(e) => setDestinoCurp(e.target.value)} placeholder="AAAA000000HDFXXX00" />
          <Field label="Monto (MXN)" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej. 100" type="number" />
          <button
            disabled={busy}
            onClick={onTransfer}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {busy ? (<><Loader2 className="animate-spin" size={18} /> Enviando…</>) : "Confirmar envío"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
