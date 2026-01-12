import { apiFetch } from "./http";

export const adminApi = {
  // ✅ Correcto: Coincide con server.createContext("/admin/users", ...)
  getUsers: () => apiFetch("admin", "/admin/users"),

  // ✅ Correcto: Coincide con server.createContext("/admin/total-money", ...)
  getTotalMoney: () => apiFetch("admin", "/admin/total-money"),

  // ✅ Correcto: Coincide con server.createContext("/admin/metrics/transactions", ...)
  getMetricsTransactions: () => apiFetch("admin", "/admin/metrics/transactions"),

  // ⚠️ CORREGIDO: En Java no existe "/admin/audit", usamos "/admin/logs"
  getAudit: () => apiFetch("admin", "/admin/logs"),

  // ✅ Correcto: Usa el mismo endpoint pero con filtro
  getLogsByCurp: (curp) =>
    apiFetch("admin", `/admin/logs?curp=${encodeURIComponent(curp)}`),
};