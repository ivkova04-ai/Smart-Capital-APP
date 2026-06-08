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

    const { error } = await supabase.from("profiles").upsert({
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

  const inputClass =
    "mt-4 w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Configuración <span className="text-primary">Personal</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Administra tu perfil y preferencias.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Perfil</h2>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={inputClass}
              />

              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              >
                <option value="Costa Rica">Costa Rica</option>
                <option value="México">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="España">España</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Otro">Otro</option>
              </select>

              <button
                onClick={saveSettings}
                className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
              >
                Guardar configuración
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Estado de Smart Capital</h2>

              <div className="mt-6 space-y-4 text-sm text-textSecondary">
                <p>✅ Movimientos conectados</p>
                <p>✅ Presupuesto inteligente activo</p>
                <p>✅ Patrimonio conectado</p>
                <p>✅ Metas financieras activas</p>
                <p>✅ Analytics inteligente funcionando</p>
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-card p-5 lg:col-span-2 lg:p-6">
              <h2 className="text-xl font-bold text-red-400">Seguridad</h2>

              <p className="mt-3 text-sm text-textSecondary">
                La autenticación está protegida mediante Supabase Auth.
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <button className="w-full rounded-full border border-white/10 px-6 py-3 font-bold text-white sm:w-auto">
                  Cambiar contraseña
                </button>

                <button className="w-full rounded-full border border-red-400/40 px-6 py-3 font-bold text-red-400 sm:w-auto">
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