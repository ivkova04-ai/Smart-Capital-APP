 import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const menu = [
    { name: "Movimientos", path: "/movimientos" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Analytics", path: "/analytics" },
    { name: "Categorías", path: "/categorias" },
    { name: "Patrimonio", path: "/patrimonio" },
    { name: "Presupuesto", path: "/presupuesto" },
    { name: "Metas", path: "/metas" },
    { name: "Configuración", path: "/configuracion" },
  ]

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate("/")
  }

  function MenuContent() {
    return (
      <>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Smart <span className="text-primary">Capital</span>
          </h1>

          <p className="mt-2 text-sm text-textSecondary">
            Finanzas inteligentes
          </p>
        </div>

        <nav className="mt-10 flex flex-col gap-3">
          {menu.map((item) => {
            const active = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-5 py-4 font-semibold transition-all duration-200 ${
                  active
                    ? "bg-primary text-white"
                    : "bg-card text-textSecondary hover:bg-input hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-bold text-red-400"
          >
            Cerrar sesión
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-background px-5 py-4 text-white lg:hidden">
        <h1 className="text-xl font-bold">
          Smart <span className="text-primary">Capital</span>
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold"
        >
          Menú
        </button>
      </div>

      <aside className="hidden min-h-screen w-72 flex-col border-r border-white/10 bg-background p-6 lg:flex">
        <MenuContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r border-white/10 bg-background p-6">
            <button
              onClick={() => setOpen(false)}
              className="mb-6 self-end rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white"
            >
              Cerrar
            </button>

            <MenuContent />
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar