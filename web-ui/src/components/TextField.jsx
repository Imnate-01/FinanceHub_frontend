export default function TextField({
  label,
  name,                 // ✅ NUEVO
  type = "text",
  value = "",            // ✅ default para evitar undefined
  onChange,
  placeholder,
  autoComplete,
  right,
  icon,                 // ✅ NUEVO
  disabled = false,     // ✅ opcional
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <div className="mt-2 relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icon}
          </div>
        )}

        <input
          name={name}                 // ✅ CLAVE para handleChange
          type={type}
          value={value}               // ✅ CLAVE
          onChange={onChange}         // ✅ CLAVE
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={[
            "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900",
            "placeholder:text-slate-400 shadow-sm outline-none",
            "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            icon ? "pl-10" : "",      // deja espacio al icono
            right ? "pr-12" : "",     // deja espacio a botón derecha
          ].join(" ")}
        />

        {right && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {right}
          </div>
        )}
      </div>
    </label>
  );
}
