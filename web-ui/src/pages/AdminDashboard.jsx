import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Vite: Navegación correcta
import { 
  LogOut, 
  RefreshCw, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react"; // ✅ Iconos necesarios
import { adminApi } from "../api/admin";

// --- Helpers ---
function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

// --- Componente Principal ---
export default function AdminDashboard() {
  const navigate = useNavigate(); // ✅ Hook para redirección en Vite
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [totalMoney, setTotalMoney] = useState(0);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedCurp, setSelectedCurp] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ✅ Lógica de Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem("token"); 
    navigate("/"); // Redirige al login
  };

  async function loadDashboard() {
    setErr("");
    setLoading(true);

    try {
      const [tm, us, mt] = await Promise.all([
        adminApi.getTotalMoney(),
        adminApi.getUsers(),
        adminApi.getMetricsTransactions(),
      ]);

      setTotalMoney(Number(tm?.total_sistema ?? 0));
      setUsers(safeArray(us));
      setMetrics(safeArray(mt));
    } catch (e) {
      setErr(e?.message || "Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogsForCurp(curp) {
    if (!curp) return;
    setErr("");
    setLogsLoading(true);

    try {
      const data = await adminApi.getLogsByCurp(curp);
      setLogs(safeArray(data)); 
    } catch (e) {
      setLogs([]);
      setErr(e?.message || "Error cargando logs");
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedCurp) loadLogsForCurp(selectedCurp);
  }, [selectedCurp]);

  const totalUsers = users.length;

  const selectedUser = useMemo(() => {
    return users.find((u) => u.curp === selectedCurp) || null;
  }, [users, selectedCurp]);

  const metricRows = useMemo(() => {
    const rows = metrics
      .map((m) => ({
        fecha: m.fecha ?? "",
        cantidad: Number(m.transacciones ?? 0),
        volumen: Number(m.volumen_dinero ?? 0),
      }))
      .filter((r) => r.fecha);

    return rows.slice(0, 10).reverse(); 
  }, [metrics]);

  const maxCount = useMemo(
    () => Math.max(1, ...metricRows.map((r) => r.cantidad)),
    [metricRows]
  );
  const maxAmount = useMemo(
    () => Math.max(1, ...metricRows.map((r) => r.volumen)),
    [metricRows]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <span>Cargando Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Supervisión financiera y auditoría
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Error Display */}
        {err && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 flex items-center gap-2">
            ⚠️ {err}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Capital Total del Sistema" 
            value={money(totalMoney)} 
            icon={<TrendingUp className="text-emerald-500" />}
          />
          <StatCard 
            title="Usuarios Registrados" 
            value={String(totalUsers)} 
          />
          <StatCard
            title="Usuario Seleccionado"
            value={selectedUser ? selectedUser.curp : "—"}
            sub={selectedUser ? `Saldo: ${money(selectedUser.balance)}` : "Haz click en la tabla"}
            highlight={!!selectedUser}
          />
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tabla de Usuarios (Izquierda) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <UsersTable
              users={users}
              selectedCurp={selectedCurp}
              onSelectCurp={(curp) => setSelectedCurp(curp)}
            />
          </div>

          {/* Panel Derecho: Métricas + Logs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <MetricsPanel rows={metricRows} maxCount={maxCount} maxAmount={maxAmount} />

            <LogsTable
              logs={logs}
              selectedCurp={selectedCurp}
              loading={logsLoading}
              onReload={() => loadLogsForCurp(selectedCurp)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-Componentes ---------- */

function StatCard({ title, value, sub, icon, highlight }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      highlight 
        ? "bg-slate-800/80 border-emerald-500/30 shadow-lg shadow-emerald-900/10" 
        : "bg-slate-900/60 border-slate-800"
    }`}>
      <div className="flex justify-between items-start">
        <div className="text-sm text-slate-400 font-medium">{title}</div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-sm text-emerald-400/80 font-medium">{sub}</div>}
    </div>
  );
}

// ✅ Tabla de Usuarios con Buscador y Paginación simple
function UsersTable({ users, selectedCurp, onSelectCurp }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // 1. Filtrado por búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter((u) =>
      u.curp.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // 2. Paginación (10 o todos)
  const visibleUsers = useMemo(() => {
    if (showAll) return filteredUsers;
    return filteredUsers.slice(0, 10);
  }, [filteredUsers, showAll]);

  const hiddenCount = filteredUsers.length - visibleUsers.length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Header con Buscador */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">👥 Usuarios</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
            Total: {users.length}
          </span>
        </div>

        {/* Input Buscador */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por CURP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowAll(false); // Reset al buscar
            }}
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="overflow-auto flex-1 min-h-[400px]">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase font-semibold bg-slate-950/50 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left p-3 pl-4">CURP</th>
              <th className="text-left p-3">Role</th>
              <th className="text-right p-3 pr-4">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {visibleUsers.map((u, idx) => {
              const active = u.curp === selectedCurp;
              return (
                <tr
                  key={u.id || idx}
                  onClick={() => onSelectCurp(u.curp)}
                  className={`cursor-pointer transition-colors ${
                    active ? "bg-emerald-500/10" : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className={`p-3 pl-4 font-medium ${active ? "text-emerald-400" : "text-slate-200"}`}>
                    {u.curp}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-right font-mono text-slate-300">
                    {money(u.balance)}
                  </td>
                </tr>
              );
            })}
            
            {visibleUsers.length === 0 && (
              <tr>
                <td className="p-8 text-center text-slate-500 italic" colSpan={3}>
                  {searchTerm ? "No se encontraron coincidencias." : "No hay usuarios registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer "Mostrar Todos" */}
      {filteredUsers.length > 10 && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 hover:bg-emerald-500/5 rounded-lg w-full"
          >
            {showAll ? (
              <> <ChevronUp className="w-3 h-3" /> Mostrar solo 10 </>
            ) : (
              <> <ChevronDown className="w-3 h-3" /> Mostrar todos ({hiddenCount} más) </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function MetricsPanel({ rows, maxCount, maxAmount }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
      <h2 className="font-semibold flex items-center gap-2">
        📊 Métricas (Últimos 10 días)
      </h2>
      
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <MiniBars
          title="Volumen (Transacciones)"
          rows={rows}
          valueKey="cantidad"
          max={maxCount}
          format={(v) => String(v)}
          colorClass="bg-blue-500"
        />
        <MiniBars
          title="Volumen (Dinero)"
          rows={rows}
          valueKey="volumen"
          max={maxAmount}
          format={(v) => money(v)}
          colorClass="bg-emerald-500"
        />
      </div>
    </div>
  );
}

function MiniBars({ title, rows, valueKey, max, format, colorClass }) {
  return (
    <div>
      <div className="text-xs uppercase font-bold text-slate-500 mb-3 tracking-wider">{title}</div>
      <div className="space-y-3">
        {rows.map((r) => {
          const v = Number(r[valueKey]) || 0;
          const w = max > 0 ? Math.round((v / max) * 100) : 0;
          return (
            <div key={`${title}-${r.fecha}`} className="text-xs group">
              <div className="flex justify-between text-slate-400 mb-1 group-hover:text-slate-200 transition-colors">
                <span>{r.fecha}</span>
                <span className="font-mono">{format(v)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full opacity-60 group-hover:opacity-100 transition-all ${colorClass}`} 
                  style={{ width: `${w}%` }} 
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="text-slate-500 italic">Sin datos</div>}
      </div>
    </div>
  );
}

// ✅ Tabla de Logs con Status
function LogsTable({ logs, selectedCurp, loading, onReload }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            📜 Historial de Movimientos
          </h2>
        </div>
        <button
          disabled={!selectedCurp || loading}
          onClick={onReload}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          title="Recargar logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase font-semibold bg-slate-950/50 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left p-3 pl-4">Fecha</th>
              <th className="text-center p-3">Tipo</th>
              <th className="text-left p-3">Detalle</th>
              <th className="text-right p-3 pr-4">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {safeArray(logs).map((l, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3 pl-4 text-slate-400 text-xs whitespace-nowrap">
                  {l.fecha ? new Date(l.fecha).toLocaleString('es-MX') : l.timestamp}
                </td>
                
                {/* Status Badge */}
                <td className="p-3 text-center">
                  <StatusBadge status={l.status} />
                </td>

                <td className="p-3 text-slate-300 text-xs">
                  <div className="flex flex-col">
                    <span className="opacity-70">Origen: {l.origen}</span>
                    <span className="opacity-70">Destino: {l.destino}</span>
                  </div>
                </td>
                
                <td className={`p-3 pr-4 text-right font-mono font-medium ${
                   l.monto < 0 ? "text-red-400" : "text-emerald-400"
                }`}>
                  {money(l.monto)}
                </td>
              </tr>
            ))}

            {safeArray(logs).length === 0 && (
              <tr>
                <td className="p-8 text-center text-slate-500 italic" colSpan={4}>
                  {selectedCurp 
                    ? (loading ? "Cargando..." : "Este usuario no tiene movimientos recientes.") 
                    : "Selecciona un usuario de la izquierda para auditar sus movimientos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ✅ Badge de Status (Colores)
function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-600">-</span>;
  
  const s = status.toUpperCase();
  let styles = "bg-slate-800 text-slate-400 border-slate-700";
  let icon = null;

  if (s === "DEPOSITO") {
    styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    icon = <TrendingUp className="w-3 h-3" />;
  } else if (s === "RETIRO") {
    styles = "bg-red-500/10 text-red-400 border-red-500/20";
    icon = <TrendingDown className="w-3 h-3" />;
  } else if (s === "TRANSFERENCIA") {
    styles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    icon = <ArrowRightLeft className="w-3 h-3" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles}`}>
      {icon}
      {s}
    </span>
  );
}