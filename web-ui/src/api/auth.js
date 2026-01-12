import { apiFetch } from "./http";

export function login(curp, password) {
  return apiFetch("auth", "/login", {
    method: "POST",
    body: JSON.stringify({ curp, password }),
  });
}

export function register(curp, password) {
  return apiFetch("auth", "/register", {
    method: "POST",
    body: JSON.stringify({ curp, password }),
  });
}
