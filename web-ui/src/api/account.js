import { apiFetch } from "./http";

export async function getBalance() {
  return apiFetch("account", "/balance", { method: "GET" });
}

export async function deposit(monto) {
  const n = Number(monto);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Monto inválido");
  return apiFetch("account", "/deposit", {
    method: "POST",
    body: JSON.stringify({ monto: n }),
  });
}

export async function withdraw(monto) {
  const n = Number(monto);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Monto inválido");
  return apiFetch("account", "/withdraw", {
    method: "POST",
    body: JSON.stringify({ monto: n }),
  });
}

export async function transfer(destinoCurp, monto) {
  const curp = String(destinoCurp || "").trim().toUpperCase();
  const n = Number(monto);

  if (!curp) throw new Error("CURP destino requerida");
  if (!Number.isFinite(n) || n <= 0) throw new Error("Monto inválido");

  return apiFetch("account", "/transfer", {
    method: "POST",
    body: JSON.stringify({ destinoCurp: curp, monto: n }),
  });
}

/**
 * Lee el historial real desde el backend:
 * GET /account/logs?limit=20
 *
 * Espera que el backend devuelva:
 *  A) { curp, items: [...] }
 *  o
 *  B) [...] directamente
 */
export async function getLastMovements({ limit = 20 } = {}) {
  const data = await apiFetch("account", `/logs?limit=${encodeURIComponent(limit)}`, {
    method: "GET",
  });

  const items = Array.isArray(data) ? data : (data.items ?? []);
  const myCurp = (Array.isArray(data) ? "" : (data.curp ?? ""));

  return items.map((it) => normalizeLogItem(it, myCurp));
}

/** Normaliza cada registro de audit_logs para tu UI */
function normalizeLogItem(item, myCurp) {
  const origen = item.origen_curp ?? "SISTEMA";
  const destino = item.destino_curp ?? "SISTEMA";
  const monto = Number(item.monto ?? 0);

  const direction =
    item.direction ??
    ((destino && myCurp && String(destino).toUpperCase() === String(myCurp).toUpperCase())
      ? "IN"
      : "OUT");

  const amountSigned =
    item.amountSigned ??
    (direction === "IN" ? Math.abs(monto) : -Math.abs(monto));

  const status = String(item.status ?? "").toUpperCase();
  let type = "MOVIMIENTO";
  if (status.includes("DEPOS")) type = "DEPOSITO";
  else if (status.includes("RETI")) type = "RETIRO";
  else if (status.includes("TRANS")) type = "TRANSFERENCIA";
  else if (origen === "SISTEMA" && destino !== "SISTEMA") type = "DEPOSITO";
  else if (destino === "SISTEMA" && origen !== "SISTEMA") type = "RETIRO";
  else if (origen !== "SISTEMA" && destino !== "SISTEMA") type = "TRANSFERENCIA";

  return {
    id: item.id,
    type,
    status,
    direction,
    amount: Math.abs(monto),
    amountSigned,
    origen_curp: origen,
    destino_curp: destino,
    timestamp: item.timestamp ?? item.ts ?? item.created_at ?? null,
    raw: item,
  };
}
