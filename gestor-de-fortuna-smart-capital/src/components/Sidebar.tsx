 import { Link, useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Movimientos",
      path: "/movimientos",
    },
    {
      name: "Categorías",
      path: "/categorias",
    },
    {
      name: "Presupuesto",
      path: "/presupuesto",
    },
    {
      name: "Patrimonio",
      path: "/patrimonio",
    },
    {
      name: "Metas",
      path: "/metas",
    },
    {
      name: "Analytics",
      path: "/analytics",
    },
    {
      name: "Configuración",
      path: "/configuracion",
    },
  ]

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate("/")
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#0d0d0d] p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Smart <span className="text-[#E0B04B]">Capital</span>
        </h1>

        <p className="mt-2 text-sm text-gray-500">
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
              className={`rounded-2xl px-5 py-4 font-semibold transition ${
                active
                  ? "bg-[#E0B04B] text-black"
                  : "bg-[#161616] text-gray-300 hover:bg-[#222222]"
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
    </aside>
  )
}

export default Sidebar