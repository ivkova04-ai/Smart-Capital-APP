 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

function Analytics() {
  const [movements, setMovements] = useState<any[]>([])
  const [cryptoMovements, setCryptoMovements] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: movementsData } = await supabase
      .from("movements")
      .select("*, categories(name)")
      .eq("user_id", user.id)

    const { data: cryptoData } = await supabase
      .from("crypto_investments")
      .select("*")
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
    setCryptoMovements(cryptoData || [])
    setCategories(categoriesData || [])
    setBudgets(budgetsData || [])
    setAssets(assetsData || [])
    setLiabilities(liabilitiesData || [])
    setGoals(goalsData || [])
  }

  const usedCurrencies = [...new Set(movements.map((m) => m.currency))]

  function getTotalsByCurrency(currency: string) {
    const ingresos = movements
      .filter((m) => m.currency === currency && m.type === "ingreso")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const gastos = movements
      .filter((m) => m.currency === currency && m.type === "gasto")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const tasaAhorro =
      ingresos > 0 ? Math.round(((ingresos - gastos) / ingresos) * 100) : 0

    return {
      currency,
      ingresos,
      gastos,
      balance: ingresos - gastos,
      tasaAhorro,
    }
  }

  const savingsByCurrency = usedCurrencies.map((currency) =>
    getTotalsByCurrency(currency)
  )

  const bestSavingCurrency = savingsByCurrency.sort(
    (a, b) => b.tasaAhorro - a.tasaAhorro
  )[0]

  const totalIngresos = movements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const totalGastos = movements
    .filter((m) => m.type === "gasto")
    .reduce((acc, m) => acc + Number(m.amount), 0)

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

  const totalPasivos = liabilities.reduce(
    (acc, item) => acc + Number(item.amount),
    0
  )

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

    const real = ((gastosPorCategoria[category.name] || 0) / totalGastos) * 100

    return real > ideal && ideal > 0
  })

  const cryptoIngresos = cryptoMovements
    .filter((item) => item.type === "ingreso")
    .reduce((acc, item) => acc + Number(item.amount), 0)

  const cryptoEgresos = cryptoMovements
    .filter((item) => item.type === "egreso")
    .reduce((acc, item) => acc + Number(item.amount), 0)

  const cryptoBalance = cryptoIngresos - cryptoEgresos

  const cryptoPorMoneda = cryptoMovements.reduce((acc: any, item) => {
    acc[item.currency] = (acc[item.currency] || 0) + Number(item.amount)
    return acc
  }, {})

  const cryptoMasUsada = Object.entries(cryptoPorMoneda).sort(
    (a: any, b: any) => b[1] - a[1]
  )[0]

  const gastosChartData = Object.entries(gastosPorCategoria).map(
    ([name, amount]: any) => ({
      name,
      amount: Number(amount),
    })
  )

  const ingresosVsGastosData = [
    {
      name: "Ingresos",
      value: totalIngresos,
    },
    {
      name: "Gastos",
      value: totalGastos,
    },
  ]

  const cryptoChartData = [
    {
      name: "Ingresos cripto",
      value: cryptoIngresos,
    },
    {
      name: "Egresos cripto",
      value: cryptoEgresos,
    },
  ]

  const cryptoDistributionData = Object.entries(cryptoPorMoneda).map(
    ([name, amount]: any) => ({
      name,
      value: Number(amount),
    })
  )

  const COLORS = ["#6967FB", "#C8F904", "#ef4444", "#38bdf8", "#f97316"]

  const cardClass = "rounded-3xl border border-white/10 bg-card p-5 lg:p-6"
    return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Analytics <span className="text-primary">Financiero</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Análisis visual basado en tus movimientos, patrimonio, metas e inversiones cripto.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-6">
            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Gasto dominante</p>
              <h2 className="mt-3 break-words text-2xl font-bold text-primary">
                {gastoDominante ? gastoDominante[0] : "Sin datos"}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Mejor tasa de ahorro</p>
              <h2
                className={`mt-3 text-2xl font-bold ${
                  bestSavingCurrency?.tasaAhorro >= 0
                    ? "text-secondary"
                    : "text-red-400"
                }`}
              >
                {bestSavingCurrency
                  ? `${bestSavingCurrency.currency} ${bestSavingCurrency.tasaAhorro}%`
                  : "Sin datos"}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Presupuesto excedido</p>
              <h2 className="mt-3 text-2xl font-bold text-red-400">
                {presupuestoExcedido.length} partidas
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Fortuna real</p>
              <h2 className="mt-3 break-words text-2xl font-bold text-primary">
                ₡{fortunaReal}
              </h2>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <h3 className="text-xl font-bold">Tasa de ahorro por moneda</h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {savingsByCurrency.length === 0 ? (
                <p className="text-textSecondary">
                  No hay datos suficientes para calcular ahorro.
                </p>
              ) : (
                savingsByCurrency.map((item) => (
                  <div
                    key={item.currency}
                    className="rounded-2xl border border-white/10 bg-input p-4"
                  >
                    <p className="text-sm text-textSecondary">
                      Moneda {item.currency}
                    </p>

                    <h4
                      className={`mt-2 text-2xl font-bold ${
                        item.tasaAhorro >= 0 ? "text-secondary" : "text-red-400"
                      }`}
                    >
                      {item.tasaAhorro}%
                    </h4>

                    <p className="mt-2 text-xs text-textSecondary">
                      Ingresos: {item.currency}
                      {item.ingresos}
                    </p>

                    <p className="mt-1 text-xs text-textSecondary">
                      Gastos: {item.currency}
                      {item.gastos}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-6">
            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Operaciones cripto</p>
              <h2 className="mt-3 text-2xl font-bold text-primary">
                {cryptoMovements.length}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Ingresos cripto</p>
              <h2 className="mt-3 text-2xl font-bold text-secondary">
                {cryptoIngresos}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Egresos cripto</p>
              <h2 className="mt-3 text-2xl font-bold text-red-400">
                {cryptoEgresos}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Balance cripto</p>
              <h2
                className={`mt-3 text-2xl font-bold ${
                  cryptoBalance >= 0 ? "text-secondary" : "text-red-400"
                }`}
              >
                {cryptoBalance}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-xl font-bold">Gastos por partida</h3>

              <div className="mt-6 h-72">
                {gastosChartData.length === 0 ? (
                  <p className="text-textSecondary">No hay gastos registrados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gastosChartData}>
                      <XAxis dataKey="name" stroke="#A7B4BA" />
                      <YAxis stroke="#A7B4BA" />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#6967FB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-xl font-bold">Ingresos vs gastos</h3>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ingresosVsGastosData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {ingresosVsGastosData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={index === 0 ? "#C8F904" : "#ef4444"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-xl font-bold">Cripto ingresos vs egresos</h3>

              <div className="mt-6 h-72">
                {cryptoMovements.length === 0 ? (
                  <p className="text-textSecondary">
                    No hay movimientos cripto registrados.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cryptoChartData}>
                      <XAxis dataKey="name" stroke="#A7B4BA" />
                      <YAxis stroke="#A7B4BA" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6967FB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-xl font-bold">Distribución cripto</h3>

              <div className="mt-6 h-72">
                {cryptoDistributionData.length === 0 ? (
                  <p className="text-textSecondary">
                    No hay datos cripto para mostrar.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cryptoDistributionData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label
                      >
                        {cryptoDistributionData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-xl font-bold">Progreso de metas</h3>

              <h2 className="mt-6 text-4xl font-bold text-primary lg:text-5xl">
                {progresoPromedioMetas}%
              </h2>

              <p className="mt-3 text-sm text-textSecondary lg:text-base">
                Promedio general de avance de tus metas financieras.
              </p>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h3 className="text-xl font-bold">Recomendaciones Smart Capital</h3>

              <div className="mt-5 space-y-3 text-sm text-textSecondary lg:text-base">
                {bestSavingCurrency && bestSavingCurrency.tasaAhorro < 10 && (
                  <p>
                    • Tu tasa de ahorro está baja en {bestSavingCurrency.currency}.
                    Revisa gastos variables y partidas excedidas.
                  </p>
                )}

                {presupuestoExcedido.length > 0 && (
                  <p>
                    • Tienes {presupuestoExcedido.length} partidas por encima de tu
                    presupuesto ideal.
                  </p>
                )}

                {progresoPromedioMetas < 30 && goals.length > 0 && (
                  <p>
                    • Tus metas avanzan lentamente. Considera programar aportes más
                    frecuentes.
                  </p>
                )}

                {fortunaReal < 0 && (
                  <p>
                    • Tu fortuna real está negativa. Prioriza reducir pasivos antes
                    de asumir nuevas deudas.
                  </p>
                )}

                {cryptoMovements.length > 0 && cryptoEgresos > cryptoIngresos && (
                  <p>
                    • Tus egresos cripto superan tus ingresos cripto. Revisa tu
                    estrategia de inversión.
                  </p>
                )}

                {cryptoMasUsada && (
                  <p>• Tu cripto más utilizada es {cryptoMasUsada[0]}.</p>
                )}

                {bestSavingCurrency &&
                  bestSavingCurrency.tasaAhorro >= 20 &&
                  fortunaReal >= 0 && (
                    <p>
                      • Buen trabajo. Tu salud financiera muestra señales positivas.
                    </p>
                  )}

                {movements.length === 0 && (
                  <p>
                    • Registra movimientos para generar recomendaciones más precisas.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Analytics