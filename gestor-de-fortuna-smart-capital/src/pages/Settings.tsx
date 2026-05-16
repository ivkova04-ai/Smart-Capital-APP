 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Settings() {
  const [name, setName] = useState("")
  const [country, setCountry] = useState("Costa Rica")

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) return

    if (data) {
      setName(data.name || "")
      setCountry(data.country || "Costa Rica")
    }
  }

  async function saveSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name,
        country,
      })

    if (error) {
      alert(error.message)
      return
    }

    alert("Configuración guardada correctamente.")
  }

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-white/10 px-8 py-5">
          <h1 className="text-2xl font-bold">
            Configuración{" "}
            <span className="text-[#E0B04B]">Personal</span>
          </h1>

          <p className="text-sm text-gray-400">
            Administra tu perfil y preferencias.
          </p>
        </header>

        <main className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-6">
              <h2 className="text-xl font-bold">Perfil</h2>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              />

              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              >
                <option value="Costa Rica">Costa Rica</option>
                <option value="México">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="España">España</option>
                <option value="Estados Unidos">
                  Estados Unidos
                </option>
                <option value="Otro">Otro</option>
              </select>

              <button
                onClick={saveSettings}
                className="mt-6 rounded-full bg-[#E0B04B] px-6 py-3 font-bold text-black"
              >
                Guardar configuración
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <h2 className="text-xl font-bold">
                Estado de Smart Capital
              </h2>

              <div className="mt-6 space-y-4 text-sm text-gray-300">
                <p>
                  ✅ Movimientos conectados
                </p>

                <p>
                  ✅ Presupuesto inteligente activo
                </p>

                <p>
                  ✅ Patrimonio conectado
                </p>

                <p>
                  ✅ Metas financieras activas
                </p>

                <p>
                  ✅ Analytics inteligente funcionando
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-[#1a1a1a] p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-red-400">
                Seguridad
              </h2>

              <p className="mt-3 text-sm text-gray-400">
                La autenticación está protegida mediante Supabase Auth.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <button className="rounded-full border border-white/10 px-6 py-3 font-bold text-white">
                  Cambiar contraseña
                </button>

                <button className="rounded-full border border-red-400/40 px-6 py-3 font-bold text-red-400">
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Settings