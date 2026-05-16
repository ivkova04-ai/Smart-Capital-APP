 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Analytics() {
  const [movements, setMovements] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: movementsData } = await supabase
      .from("movements")
      .select("*, categories(name)")
      .eq("user_id", user.id)

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)

    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)

    const { data: assetsData } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)

    const { data: liabilitiesData } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", user.id)

    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)

    setMovements(movementsData || [])
    setCategories(categoriesData || [])
    setBudgets(budgetsData || [])
    setAssets(assetsData || [])
    setLiabilities(liabilitiesData || [])
    setGoals(goalsData || [])
  }

  const totalIngresos = movements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const totalGastos = movements
    .filter((m) => m.type === "gasto")
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const tasaAhorro =
    totalIngresos > 0
      ? Math.round(((totalIngresos - totalGastos) / totalIngresos) * 100)
      : 0

  const gastosPorCategoria = movements
    .filter((m) => m.type === "gasto")
    .reduce((acc: any, movement) => {
      const name = movement.categories?.name || "Sin categoría"
      acc[name] = (acc[name] || 0) + Number(movement.amount)
      return acc
    }, {})

  const gastoDominante = Object.entries(gastosPorCategoria).sort(
    (a: any, b: any) => b[1] - a[1]
  )[0]

  const totalActivos = assets.reduce((acc, item) => acc + Number(item.amount), 0)
  const totalPasivos = liabilities.reduce((acc, item) => acc + Number(item.amount), 0)
  const fortunaReal = totalActivos - totalPasivos

  const progresoPromedioMetas =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((acc, goal) => {
            const progress = Math.min(
              (Number(goal.current_amount) / Number(goal.target_amount)) * 100,
              100
            )
            return acc + progress
          }, 0) / goals.length
        )

  const presupuestoExcedido = categories.filter((category) => {
    const budget = budgets.find((b) => b.category_id === category.id)
    const ideal = Number(budget?.ideal_percentage || 0)

    if (totalGastos === 0) return false

    const real =
      ((gastosPorCategoria[category.name] || 0) / totalGastos) * 100

    return real > ideal && ideal > 0
  })

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-white/10 px-8 py-5">
          <h1 className="text-2xl font-bold">
            Analytics <span className="text-[#E0B04B]">Financiero</span>
          </h1>

          <p className="text-sm text-gray-400">
            Análisis inteligente basado en tus datos reales.
          </p>
        </header>

        <main className="p-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <p className="text-sm text-gray-400">Gasto dominante</p>
              <h2 className="mt-3 text-2xl font-bold text-[#E0B04B]">
                {gastoDominante ? gastoDominante[0] : "Sin datos"}
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <p className="text-sm text-gray-400">Tasa de ahorro</p>
              <h2 className={`mt-3 text-2xl font-bold ${tasaAhorro >= 0 ? "text-green-400" : "text-red-400"}`}>
                {tasaAhorro}%
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <p className="text-sm text-gray-400">Presupuesto excedido</p>
              <h2 className="mt-3 text-2xl font-bold text-red-400">
                {presupuestoExcedido.length} partidas
              </h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <p className="text-sm text-gray-400">Fortuna real</p>
              <h2 className="mt-3 text-2xl font-bold text-[#E0B04B]">
                ₡{fortunaReal}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <h3 className="text-xl font-bold">Gastos por partida</h3>

              <div className="mt-6 space-y-4">
                {Object.keys(gastosPorCategoria).length === 0 ? (
                  <p className="text-gray-400">No hay gastos registrados.</p>
                ) : (
                  Object.entries(gastosPorCategoria).map(([name, amount]: any) => {
                    const percent =
                      totalGastos > 0 ? Math.round((amount / totalGastos) * 100) : 0

                    return (
                      <div key={name}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{name}</span>
                          <span className="text-[#E0B04B]">{percent}%</span>
                        </div>

                        <div className="h-3 rounded-full bg-[#111111]">
                          <div
                            className="h-3 rounded-full bg-[#E0B04B]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
              <h3 className="text-xl font-bold">Progreso de metas</h3>

              <h2 className="mt-6 text-5xl font-bold text-[#E0B04B]">
                {progresoPromedioMetas}%
              </h2>

              <p className="mt-3 text-gray-400">
                Promedio general de avance de tus metas financieras.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-6">
            <h3 className="text-xl font-bold">Recomendaciones Smart Capital</h3>

            <div className="mt-5 space-y-3 text-gray-300">
              {tasaAhorro < 10 && (
                <p>• Tu tasa de ahorro está baja. Revisa gastos variables y partidas excedidas.</p>
              )}

              {presupuestoExcedido.length > 0 && (
                <p>
                  • Tienes {presupuestoExcedido.length} partidas por encima de tu presupuesto ideal.
                </p>
              )}

              {progresoPromedioMetas < 30 && goals.length > 0 && (
                <p>• Tus metas avanzan lentamente. Considera programar aportes más frecuentes.</p>
              )}

              {fortunaReal < 0 && (
                <p>• Tu fortuna real está negativa. Prioriza reducir pasivos antes de asumir nuevas deudas.</p>
              )}

              {tasaAhorro >= 20 && fortunaReal >= 0 && (
                <p>• Buen trabajo. Tu salud financiera muestra señales positivas.</p>
              )}

              {movements.length === 0 && (
                <p>• Registra movimientos para generar recomendaciones más precisas.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Analytics