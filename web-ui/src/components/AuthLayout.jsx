import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* LADO IZQUIERDO: Branding y Arte Animado */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-12 flex-col justify-between overflow-hidden">
        
        {/* Círculos decorativos ANIMADOS (Efecto Lámpara de Lava) */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [0, 50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.5, 1],
                x: [0, -50, 0],
                y: [0, -30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-30 blur-3xl"
        />
        
        {/* Logotipo con efecto Glass */}
        <div className="relative z-10 flex items-center gap-3 text-2xl font-bold tracking-tight">
          <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <span className="text-shadow-sm">FinanceHub</span>
        </div>

        {/* Texto de Marketing con entrada suave */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative z-10 max-w-md"
        >
          <h1 className="text-5xl font-bold leading-tight mb-6 drop-shadow-md">
            Tu dinero, <br/>
            <span className="text-blue-200">inteligente y seguro.</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed opacity-90 font-light">
            Gestiona tus finanzas, realiza transferencias al instante y visualiza tus gastos en tiempo real con nuestra tecnología bancaria de vanguardia.
          </p>
        </motion.div>

        <div className="relative z-10 text-sm text-blue-200/60 font-medium tracking-wide">
          © 2026 FinanceHub Secure Systems
        </div>
      </div>

      {/* LADO DERECHO: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        {/* Decoración sutil en el lado blanco */}
        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 lg:hidden"></div>

        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h2>
            <p className="text-slate-500 text-lg">{subtitle}</p>
          </div>
          
          {children}

          {footer && (
            <div className="mt-10 pt-6 border-t border-gray-50 text-center">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}