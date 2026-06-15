 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Dashboard() {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [showHistorical, setShowHistorical] = useState(false)

  const [movements, setMovements] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [profileName, setProfileName] = useState("")

  useEffect(() => {
    fetchData()
  }, [month, year, showHistorical])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function fetchData() {
    const user = await getUser()
    if (!user) return

    await Promise.all([
      fetchProfile(user.id),
      fetchMovements(user.id),
      fetchAssets(user.id),
      fetchInvestments(user.id),
      fetchLiabilities(user.id),
    ])
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single()

    setProfileName(data?.name || "")
  }

  async function fetchMovements(userId: string) {
    let query = supabase
      .from("movements")
      .select(`
        *,
        categories(name),
        subcategories(name),
        payment_methods(name, type, brand, bank),
        investments(name),
        liabilities(name)
      `)
      .eq("user_id", userId)
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

  async function fetchAssets(userId: string) {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      alert(error.message)
      return
    }

    setAssets(data || [])
  }

  async function fetchInvestments(userId: string) {
    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      alert(error.message)
      return
    }

    setInvestments(data || [])
  }

  async function fetchLiabilities(userId: string) {
    const { data, error } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      alert(error.message)
      return
    }

    setLiabilities(data || [])
  }

  const usedCurrencies = [
    ...new Set([
      ...movements.map((m) => m.currency),
      ...assets.map((item) => item.currency),
      ...investments.map((item) => item.currency || "₡"),
      ...liabilities.map((item) => item.currency),
    ]),
  ]

  function getTotalsByCurrency(currency: string) {
    const ingresos = movements
      .filter((m) => m.currency === currency && m.type === "ingreso")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const gastos = movements
      .filter((m) => m.currency === currency && m.type === "gasto")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const inversionesRealizadas = movements
      .filter((m) => m.currency === currency && m.type === "inversion")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const abonosDeuda = movements
      .filter((m) => m.currency === currency && m.type === "abono_deuda")
      .reduce((acc, m) => acc + Number(m.amount), 0)

    const totalAssets = assets
      .filter((item) => item.currency === currency)
      .reduce((acc, item) => acc + Number(item.amount), 0)

    const totalInvestments = investments
      .filter((item) => (item.currency || "₡") === currency)
      .reduce((acc, item) => acc + Number(item.current_value), 0)

    const totalLiabilities = liabilities
      .filter((item) => item.currency === currency)
      .reduce((acc, item) => acc + Number(item.amount), 0)

    const capitalDisponible =
      ingresos - gastos - inversionesRealizadas - abonosDeuda

    const patrimonioNeto =
      capitalDisponible + totalAssets + totalInvestments - totalLiabilities

    return {
      ingresos,
      gastos,
      inversionesRealizadas,
      abonosDeuda,
      balance: ingresos - gastos,
      capitalDisponible,
      activos: totalAssets,
      inversiones: totalInvestments,
      pasivos: totalLiabilities,
      patrimonioNeto,
    }
  }

  function getPaymentMethodLabel(method: any) {
    if (!method) return ""

    if (method.type === "efectivo") return "Efectivo"

    return `${method.bank || ""} ${method.brand || ""} ${
      method.type === "debito" ? "Débito" : "Crédito"
    }`
  }

  function getMovementTypeLabel(type: string) {
    if (type === "ingreso") return "Ingreso"
    if (type === "gasto") return "Gasto"
    if (type === "inversion") return "Inversión"
    if (type === "abono_deuda") return "Abono deuda"
    return type
  }

  const incomeBySubcategory = movements
    .filter((m) => m.type === "ingreso")
    .reduce((acc: any, movement) => {
      const subcategoryName = movement.subcategories?.name || "Sin subpartida"
      const key = `${movement.currency} ${subcategoryName}`

      acc[key] = {
        currency: movement.currency,
        subcategory: subcategoryName,
        amount: (acc[key]?.amount || 0) + Number(movement.amount),
      }

      return acc
    }, {})

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

  const creditCardBalances = movements
    .filter(
      (movement) =>
        movement.type === "gasto" &&
        movement.payment_methods &&
        movement.payment_methods.type === "credito"
    )
    .reduce((acc: any, movement) => {
      const method = movement.payment_methods
      const cardName =
        method.name ||
        `${method.bank || "Banco"} ${method.brand || "Tarjeta"} Crédito`

      const key = `${movement.currency}-${cardName}`

      acc[key] = {
        currency: movement.currency,
        cardName,
        bank: method.bank || "",
        brand: method.brand || "",
        amount: (acc[key]?.amount || 0) + Number(movement.amount),
      }

      return acc
    }, {})

  const totalCreditCardDebtByCurrency: Record<string, number> = Object.values(
    creditCardBalances as Record<string, any>
  ).reduce((acc: Record<string, number>, item: any) => {
    acc[item.currency] = (acc[item.currency] || 0) + Number(item.amount)
    return acc
  }, {})

  const maxIncomeBySubcategory = Math.max(
    ...Object.values(incomeBySubcategory).map((item: any) => item.amount),
    1
  )

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

  const inputClass =
    "rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  const cardClass = "rounded-3xl border border-white/10 bg-card p-5 lg:p-6"
    return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">
              Dashboard <span className="text-primary">Financiero</span>
            </h1>

            <p className="text-sm text-textSecondary">
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
                  className={inputClass}
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
                  className={`${inputClass} sm:w-28`}
                />
              </>
            )}

            <button
              onClick={() => setShowHistorical(!showHistorical)}
              className={`rounded-xl px-5 py-3 font-bold ${
                showHistorical
                  ? "bg-primary text-white"
                  : "border border-primary/40 text-primary"
              }`}
            >
              {showHistorical ? "Volver a mensual" : "Histórico total"}
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <h2 className="text-2xl font-bold lg:text-3xl">
              Hola <span className="text-primary">{profileName || "👋"}</span>
            </h2>

            <p className="mt-3 text-sm text-textSecondary lg:text-base">
              Resumen de patrimonio, capital disponible, ingresos, gastos,
              inversiones, pasivos y tarjetas.
            </p>
          </div>

          {usedCurrencies.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-card p-8 text-center lg:p-10">
              <p className="text-textSecondary">
                No hay datos registrados para este periodo.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {usedCurrencies.map((currency) => {
                const totals = getTotalsByCurrency(currency)

                return (
                  <div key={currency}>
                    <h2 className="mb-4 text-xl font-bold lg:text-2xl">
                      Patrimonio en {currency}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 lg:gap-6">
                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">
                          Patrimonio neto
                        </p>

                        <h2
                          className={`mt-3 break-words text-3xl font-bold lg:text-4xl ${
                            totals.patrimonioNeto >= 0
                              ? "text-primary"
                              : "text-red-400"
                          }`}
                        >
                          {currency}
                          {totals.patrimonioNeto}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">
                          Capital disponible
                        </p>

                        <h2
                          className={`mt-3 break-words text-3xl font-bold lg:text-4xl ${
                            totals.capitalDisponible >= 0
                              ? "text-secondary"
                              : "text-red-400"
                          }`}
                        >
                          {currency}
                          {totals.capitalDisponible}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">Activos</p>

                        <h2 className="mt-3 break-words text-3xl font-bold text-secondary lg:text-4xl">
                          {currency}
                          {totals.activos}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">Inversiones</p>

                        <h2 className="mt-3 break-words text-3xl font-bold text-primary lg:text-4xl">
                          {currency}
                          {totals.inversiones}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">Pasivos</p>

                        <h2 className="mt-3 break-words text-3xl font-bold text-red-400 lg:text-4xl">
                          {currency}
                          {totals.pasivos}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">Ingresos</p>

                        <h2 className="mt-3 break-words text-2xl font-bold text-secondary">
                          {currency}
                          {totals.ingresos}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">Gastos</p>

                        <h2 className="mt-3 break-words text-2xl font-bold text-red-400">
                          {currency}
                          {totals.gastos}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">
                          Inversiones realizadas
                        </p>

                        <h2 className="mt-3 break-words text-2xl font-bold text-primary">
                          {currency}
                          {totals.inversionesRealizadas}
                        </h2>
                      </div>

                      <div className={cardClass}>
                        <p className="text-sm text-textSecondary">
                          Abonos deuda
                        </p>

                        <h2 className="mt-3 break-words text-2xl font-bold text-red-400">
                          {currency}
                          {totals.abonosDeuda}
                        </h2>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-red-500/20 bg-card p-5 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-red-400">
                  Saldos de tarjetas de crédito
                </h3>

                <p className="mt-2 text-sm text-textSecondary">
                  Total de gastos del periodo realizados con tarjetas de crédito.
                </p>
              </div>

              {Object.keys(totalCreditCardDebtByCurrency).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(totalCreditCardDebtByCurrency).map(
                    ([currency, amount]) => (
                      <span
                        key={currency}
                        className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400"
                      >
                        Total {currency}
                        {amount}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.keys(creditCardBalances).length === 0 ? (
                <p className="text-textSecondary">
                  No hay gastos registrados con tarjeta de crédito en este periodo.
                </p>
              ) : (
                Object.values(creditCardBalances as Record<string, any>).map(
                  (item: any) => (
                    <div
                      key={`${item.currency}-${item.cardName}`}
                      className="rounded-2xl border border-red-400/20 bg-input p-4"
                    >
                      <p className="text-sm text-textSecondary">Tarjeta crédito</p>

                      <h4 className="mt-2 text-lg font-bold text-white">
                        {item.cardName}
                      </h4>

                      <p className="mt-1 text-sm text-textSecondary">
                        {item.bank || "Banco no indicado"} ·{" "}
                        {item.brand || "Marca no indicada"}
                      </p>

                      <h3 className="mt-4 break-words text-3xl font-bold text-red-400">
                        {item.currency}
                        {item.amount}
                      </h3>

                      <p className="mt-2 text-xs text-textSecondary">
                        Este monto representa el saldo estimado a pagar por los
                        gastos del periodo.
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-xl font-bold">Ingresos por subpartida</h3>

              <div className="mt-6 space-y-4">
                {Object.keys(incomeBySubcategory).length === 0 ? (
                  <p className="text-textSecondary">
                    No hay ingresos registrados en este periodo.
                  </p>
                ) : (
                  Object.values(incomeBySubcategory).map((item: any) => (
                    <div key={`${item.currency}-${item.subcategory}`}>
                      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                        <span>
                          {item.currency} {item.subcategory}
                        </span>

                        <span className="text-secondary">
                          {item.currency}
                          {item.amount}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-input">
                        <div
                          className="h-3 rounded-full bg-secondary"
                          style={{
                            width: `${
                              (item.amount / maxIncomeBySubcategory) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className="text-xl font-bold">Gastos por partida</h3>

              <div className="mt-6 space-y-4">
                {Object.keys(expensesByCategory).length === 0 ? (
                  <p className="text-textSecondary">
                    No hay gastos registrados en este periodo.
                  </p>
                ) : (
                  Object.values(expensesByCategory).map((item: any) => (
                    <div key={`${item.currency}-${item.category}`}>
                      <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                        <span>
                          {item.currency} {item.category}
                        </span>

                        <span className="text-primary">
                          {item.currency}
                          {item.amount}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-input">
                        <div
                          className="h-3 rounded-full bg-primary"
                          style={{
                            width: `${
                              (item.amount / maxExpenseByCategory) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <h3 className="text-xl font-bold">Últimos 10 movimientos</h3>

            <div className="mt-6 space-y-4">
              {latestMovements.length === 0 ? (
                <p className="text-textSecondary">
                  No hay movimientos para mostrar.
                </p>
              ) : (
                latestMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-input p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5"
                  >
                    <div>
                      <p className="font-bold">
                        {getMovementTypeLabel(movement.type)}
                        {movement.categories &&
                          ` · ${movement.categories?.name} / ${movement.subcategories?.name}`}
                      </p>

                      <p className="text-sm text-textSecondary/70">
                        {movement.movement_date}
                      </p>

                      {movement.investments && (
                        <p className="mt-1 text-sm text-primary">
                          Inversión: {movement.investments.name}
                        </p>
                      )}

                      {movement.liabilities && (
                        <p className="mt-1 text-sm text-red-400">
                          Deuda: {movement.liabilities.name}
                        </p>
                      )}

                      {movement.payment_methods && (
                        <p className="mt-1 text-sm text-primary">
                          Medio de pago:{" "}
                          {getPaymentMethodLabel(movement.payment_methods)}
                        </p>
                      )}

                      {movement.description && (
                        <p className="mt-1 text-sm text-textSecondary">
                          {movement.description}
                        </p>
                      )}
                    </div>

                    <p
                      className={`text-xl font-bold ${
                        movement.type === "ingreso"
                          ? "text-secondary"
                          : movement.type === "inversion"
                          ? "text-primary"
                          : "text-red-400"
                      }`}
                    >
                      {movement.currency}
                      {movement.amount}
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