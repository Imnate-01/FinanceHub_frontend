// src/api/admin.js
import { apiFetch } from "./http";

export const adminApi = {
  // ✅ Balances por usuario (users + accounts)
  getUsers: () => apiFetch("admin", "/admin/users"),

  // ✅ Total de dinero del sistema
  getTotalMoney: () => apiFetch("admin", "/admin/total-money"),

  // ✅ Métricas para gráficas (count + amount por día)
  // (según tu AccountServer: /admin/metrics/transactions)
  getMetricsTransactions: () => apiFetch("admin", "/admin/metrics/transactions"),

  // ✅ Auditoría completa (opcional pero útil)
  getAudit: () => apiFetch("admin", "/admin/audit"),

  // ✅ Logs por usuario (por CURP)
  getLogsByCurp: (curp) =>
    apiFetch("admin", `/admin/logs?curp=${encodeURIComponent(curp)}`),
};
