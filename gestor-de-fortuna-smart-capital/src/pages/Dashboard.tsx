 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Dashboard() {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [showHistorical, setShowHistorical] = useState(false)
  const [movements, setMovements] = useState<any[]>([])
  const [profileName, setProfileName] = useState("")

  useEffect(() => {
    fetchMovements()
    fetchProfile()
  }, [month, year, showHistorical])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    setProfileName(data?.name || "")
  }

  async function fetchMovements() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from("movements")
      .select(`
        *,
        categories(name),
        subcategories(name)
      `)
      .eq("user_id", user.id)
      .order("movement_date", { ascending: false })

    if (!showHistorical) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

      query = query.gte("movement_date", startDate).lt("movement_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      alert(error.message)
      return
    }

    setMovements(data || [])
  }

  const usedCurrencies = [...new Set(movements.map((m) => m.currency))]

  function getTotalsByCurrency(currency: string) {
    const ingresos = movements
      .filter((m) => m.currency === currency && m.type === "ingreso")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const gastos = movements
      .filter((m) => m.currency === currency && m.type === "gasto")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
    }
  }

  const expensesByCategory = movements
    .filter((m) => m.type === "gasto")
    .reduce((acc: any, movement) => {
      const categoryName = movement.categories?.name || "Sin categoría"
      const key = `${movement.currency} ${categoryName}`

      acc[key] = {
        currency: movement.currency,
        category: categoryName,
        amount: (acc[key]?.amount || 0) + Number(movement.amount),
      }

      return acc
    }, {})

  const maxExpenseByCategory = Math.max(
    ...Object.values(expensesByCategory).map((item: any) => item.amount),
    1
  )

  const latestMovements = movements.slice(0, 10)

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  return (
    <div className="min-h-screen bg-[#121212] text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">
              Dashboard <span className="text-[#E0B04B]">Financiero</span>
            </h1>

            <p className="text-sm text-gray-400">
              {showHistorical
                ? "Resumen histórico total de tus finanzas."
                : "Resumen mensual de tus finanzas."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!showHistorical && (
              <>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  {months.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <input
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  type="number"
                  className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none sm:w-28"
                />
              </>
            )}

            <button
              onClick={() => setShowHistorical(!showHistorical)}
              className={`rounded-xl px-5 py-3 font-bold ${
                showHistorical
                  ? "bg-[#E0B04B] text-black"
                  : "border border-[#E0B04B]/40 text-[#E0B04B]"
              }`}
            >
              {showHistorical ? "Volver a mensual" : "Histórico total"}
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8 rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-5 lg:p-6">
            <h2 className="text-2xl font-bold lg:text-3xl">
              Hola <span className="text-[#E0B04B]">{profileName || "👋"}</span>
            </h2>

            <p className="mt-3 text-sm text-gray-400 lg:text-base">
              Estos son los datos más relevantes de tu situación financiera.
            </p>
          </div>

          {usedCurrencies.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 text-center lg:p-10">
              <p className="text-gray-400">
                No hay movimientos registrados para este periodo.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {usedCurrencies.map((currency) => {
                const totals = getTotalsByCurrency(currency)

                return (
                  <div key={currency}>
                    <h2 className="mb-4 text-xl font-bold lg:text-2xl">
                      Resumen en {currency}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
                        <p className="text-sm text-gray-400">Balance</p>
                        <h2 className="mt-3 break-words text-3xl font-bold text-[#E0B04B] lg:text-4xl">
                          {currency}{totals.balance}
                        </h2>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
                        <p className="text-sm text-gray-400">Ingresos</p>
                        <h2 className="mt-3 break-words text-3xl font-bold text-green-400 lg:text-4xl">
                          {currency}{totals.ingresos}
                        </h2>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
                        <p className="text-sm text-gray-400">Gastos</p>
                        <h2 className="mt-3 break-words text-3xl font-bold text-red-400 lg:text-4xl">
                          {currency}{totals.gastos}
                        </h2>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
              <h3 className="text-xl font-bold">Gastos por partida</h3>

              <div className="mt-6 space-y-4">
                {Object.keys(expensesByCategory).length === 0 ? (
                  <p className="text-gray-400">
                    No hay gastos registrados en este periodo.
                  </p>
                ) : (
                  Object.values(expensesByCategory).map((item: any) => (
                    <div key={`${item.currency}-${item.category}`}>
                      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                        <span>{item.currency} {item.category}</span>
                        <span className="text-[#E0B04B]">
                          {item.currency}{item.amount}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-[#111111]">
                        <div
                          className="h-3 rounded-full bg-[#E0B04B]"
                          style={{
                            width: `${(item.amount / maxExpenseByCategory) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
              <h3 className="text-xl font-bold">Ingresos vs gastos</h3>

              <div className="mt-6 space-y-5">
                {usedCurrencies.length === 0 ? (
                  <p className="text-gray-400">No hay datos para comparar.</p>
                ) : (
                  usedCurrencies.map((currency) => {
                    const totals = getTotalsByCurrency(currency)
                    const max = Math.max(totals.ingresos, totals.gastos, 1)

                    const gastoPorcentaje =
                      totals.ingresos > 0
                        ? Math.round((totals.gastos / totals.ingresos) * 100)
                        : 0

                    const ahorroPorcentaje =
                      totals.ingresos > 0
                        ? Math.round(
                            ((totals.ingresos - totals.gastos) / totals.ingresos) * 100
                          )
                        : 0

                    return (
                      <div key={currency}>
                        <p className="mb-3 font-bold">{currency}</p>

                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#111111] p-4">
                            <p className="text-sm text-gray-400">
                              Gasto sobre ingreso
                            </p>
                            <p className="mt-1 text-2xl font-bold text-red-400">
                              {gastoPorcentaje}%
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#111111] p-4">
                            <p className="text-sm text-gray-400">
                              Porcentaje libre
                            </p>
                            <p
                              className={`mt-1 text-2xl font-bold ${
                                ahorroPorcentaje >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {ahorroPorcentaje}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Ingresos</span>
                              <span className="text-green-400">
                                {currency}{totals.ingresos}
                              </span>
                            </div>

                            <div className="h-3 rounded-full bg-[#111111]">
                              <div
                                className="h-3 rounded-full bg-green-400"
                                style={{ width: `${(totals.ingresos / max) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Gastos</span>
                              <span className="text-red-400">
                                {currency}{totals.gastos}
                              </span>
                            </div>

                            <div className="h-3 rounded-full bg-[#111111]">
                              <div
                                className="h-3 rounded-full bg-red-400"
                                style={{ width: `${(totals.gastos / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
            <h3 className="text-xl font-bold">Últimos 10 movimientos</h3>

            <div className="mt-6 space-y-4">
              {latestMovements.length === 0 ? (
                <p className="text-gray-400">No hay movimientos para mostrar.</p>
              ) : (
                latestMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#111111] p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5"
                  >
                    <div>
                      <p className="font-bold">
                        {movement.type === "ingreso" ? "Ingreso" : "Gasto"} ·{" "}
                        {movement.categories?.name} / {movement.subcategories?.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {movement.movement_date}
                      </p>

                      {movement.description && (
                        <p className="mt-1 text-sm text-gray-400">
                          {movement.description}
                        </p>
                      )}
                    </div>

                    <p
                      className={`text-xl font-bold ${
                        movement.type === "ingreso"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {movement.currency}{movement.amount}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard