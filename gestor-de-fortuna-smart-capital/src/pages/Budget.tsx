 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Budget() {
  const currentDate = new Date()

  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])

  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [selectedCurrency, setSelectedCurrency] = useState("₡")

  useEffect(() => {
    fetchData()
  }, [month, year])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function fetchData() {
    const user = await getUser()
    if (!user) return

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("*, categories(name)")
      .eq("user_id", user.id)

    const { data: movementsData } = await supabase
      .from("movements")
      .select("*")
      .eq("user_id", user.id)
      .gte("movement_date", startDate)
      .lt("movement_date", endDate)

    setCategories(
      (categoriesData || []).filter(
        (category: any) => category.name?.toLowerCase() !== "ingreso"
      )
    )

    setBudgets(
      (budgetsData || []).filter(
        (budget: any) => budget.categories?.name?.toLowerCase() !== "ingreso"
      )
    )

    setMovements(movementsData || [])
  }

  const availableCurrencies = [
    ...new Set([
      "₡",
      "$",
      "€",
      ...movements.map((movement) => movement.currency),
      ...budgets.map((budget) => budget.currency || "₡"),
    ]),
  ]

  function getBudgetForCategory(categoryId: string, currency: string) {
    return budgets.find(
      (budget) =>
        budget.category_id === categoryId &&
        (budget.currency || "₡") === currency
    )
  }

  async function saveBudgetAmount(
    categoryId: string,
    currency: string,
    idealAmount: number
  ) {
    const user = await getUser()
    if (!user) return

    const category = categories.find((item) => item.id === categoryId)

    if (category?.name?.toLowerCase() === "ingreso") {
      alert("La partida Ingreso no se puede presupuestar.")
      return
    }

    const existingBudget = getBudgetForCategory(categoryId, currency)

    if (existingBudget) {
      const { error } = await supabase
        .from("budgets")
        .update({
          ideal_amount: idealAmount,
          currency,
        })
        .eq("id", existingBudget.id)
        .eq("user_id", user.id)

      if (error) {
        alert(error.message)
        return
      }
    } else {
      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        category_id: categoryId,
        ideal_amount: idealAmount,
        currency,
        ideal_percentage: 0,
      })

      if (error) {
        alert(error.message)
        return
      }
    }

    fetchData()
  }

  const incomeMovements = movements.filter(
    (movement) =>
      movement.type === "ingreso" && movement.currency === selectedCurrency
  )

  const expenseMovements = movements.filter(
    (movement) =>
      movement.type === "gasto" && movement.currency === selectedCurrency
  )

  const totalIncome = incomeMovements.reduce(
    (acc, movement) => acc + Number(movement.amount),
    0
  )

  const totalExpenses = expenseMovements.reduce(
    (acc, movement) => acc + Number(movement.amount),
    0
  )

  const availableMoney = totalIncome - totalExpenses

  const totalIdealAmount = categories.reduce((acc, category) => {
    const budget = getBudgetForCategory(category.id, selectedCurrency)
    return acc + Number(budget?.ideal_amount || 0)
  }, 0)

  const totalIdealPercentage =
    totalIncome > 0 ? Math.round((totalIdealAmount / totalIncome) * 100) : 0

  function getCategoryExpense(categoryId: string) {
    return expenseMovements
      .filter((movement) => movement.category_id === categoryId)
      .reduce((acc, movement) => acc + Number(movement.amount), 0)
  }

  function getIdealPercentage(categoryId: string) {
    if (totalIncome === 0) return 0

    const budget = getBudgetForCategory(categoryId, selectedCurrency)
    const idealAmount = Number(budget?.ideal_amount || 0)

    return Math.round((idealAmount / totalIncome) * 100)
  }

  function getRealPercentage(categoryId: string) {
    if (totalIncome === 0) return 0

    const categoryExpense = getCategoryExpense(categoryId)

    return Math.round((categoryExpense / totalIncome) * 100)
  }

  function formatMoney(currency: string, amount: number) {
    return `${currency}${Number(amount || 0).toLocaleString("es-CR")}`
  }

  const alignmentScore =
    categories.length === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            100 -
              categories.reduce((acc, category) => {
                const ideal = getIdealPercentage(category.id)
                const real = getRealPercentage(category.id)

                return acc + Math.abs(ideal - real)
              }, 0) /
                categories.length
          )
        )

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
              Presupuesto <span className="text-primary">por Montos</span>
            </h1>

            <p className="text-sm text-textSecondary">
              Define montos ideales por partida. Los porcentajes se calculan automáticamente con tus ingresos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className={inputClass}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  Moneda {currency}
                </option>
              ))}
            </select>

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
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-6 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <p className="text-sm text-textSecondary">
              Alineación con presupuesto ideal en {selectedCurrency}
            </p>

            <h2
              className={`mt-2 text-4xl font-bold lg:text-5xl ${
                alignmentScore >= 80
                  ? "text-secondary"
                  : alignmentScore >= 60
                  ? "text-primary"
                  : "text-red-400"
              }`}
            >
              {alignmentScore}%
            </h2>

            <p className="mt-3 text-sm text-textSecondary">
              {alignmentScore >= 80
                ? "Excelente. Tus gastos están bastante alineados con tu presupuesto ideal."
                : alignmentScore >= 60
                ? "Vas bien, pero hay partidas que necesitan ajustes."
                : "Tu gasto real está bastante alejado de tu presupuesto ideal."}
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Ingresos del periodo</p>

              <h2 className="mt-2 break-words text-3xl font-bold text-secondary">
                {formatMoney(selectedCurrency, totalIncome)}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Gastos del periodo</p>

              <h2 className="mt-2 break-words text-3xl font-bold text-red-400">
                {formatMoney(selectedCurrency, totalExpenses)}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Disponible</p>

              <h2
                className={`mt-2 break-words text-3xl font-bold ${
                  availableMoney >= 0 ? "text-primary" : "text-red-400"
                }`}
              >
                {formatMoney(selectedCurrency, availableMoney)}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">Ideal asignado</p>

              <h2
                className={`mt-2 break-words text-3xl font-bold ${
                  totalIdealAmount <= totalIncome ? "text-primary" : "text-red-400"
                }`}
              >
                {formatMoney(selectedCurrency, totalIdealAmount)}
              </h2>

              <p
                className={`mt-2 text-sm font-bold ${
                  totalIdealPercentage <= 100 ? "text-secondary" : "text-red-400"
                }`}
              >
                {totalIdealPercentage}% del ingreso
              </p>
            </div>
          </div>

          {totalIncome === 0 && (
            <div className="mb-6 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <p className="text-sm text-primary">
                No hay ingresos registrados en {selectedCurrency} para este periodo.
                Puedes asignar montos, pero los porcentajes se calcularán cuando existan ingresos.
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
              <h2 className="text-xl font-bold">Presupuesto ideal</h2>

              <p className="mt-2 text-sm text-textSecondary">
                Ingresa montos ideales por partida para la moneda seleccionada.
              </p>

              <div className="mt-6 space-y-5">
                {categories.length === 0 ? (
                  <p className="text-textSecondary">
                    Primero debes crear partidas de gasto en Categorías.
                  </p>
                ) : (
                  categories.map((category) => {
                    const budget = getBudgetForCategory(category.id, selectedCurrency)
                    const idealAmount = Number(budget?.ideal_amount || 0)
                    const idealPercentage = getIdealPercentage(category.id)

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-white/10 bg-input p-4 lg:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{category.name}</h3>

                            <p className="mt-1 text-sm text-primary">
                              Monto ideal:{" "}
                              {formatMoney(selectedCurrency, idealAmount)}
                            </p>

                            <p className="mt-1 text-sm text-textSecondary">
                              % ideal calculado: {idealPercentage}%
                            </p>
                          </div>

                          <input
                            type="number"
                            defaultValue={idealAmount}
                            onBlur={(e) =>
                              saveBudgetAmount(
                                category.id,
                                selectedCurrency,
                                Number(e.target.value || 0)
                              )
                            }
                            placeholder="Monto"
                            className="w-full rounded-xl border border-white/10 bg-card px-4 py-3 text-white outline-none focus:border-primary/60 sm:w-36"
                          />
                        </div>

                        <div className="mt-4 h-3 rounded-full bg-card">
                          <div
                            className="h-3 rounded-full bg-primary"
                            style={{
                              width: `${Math.min(idealPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-xl font-bold">Presupuesto real</h2>

              <p className="mt-2 text-sm text-textSecondary">
                Compara monto ideal contra gasto real y porcentaje sobre ingreso.
              </p>

              <div className="mt-6 space-y-5">
                {categories.length === 0 ? (
                  <p className="text-textSecondary">No hay partidas para analizar.</p>
                ) : (
                  categories.map((category) => {
                    const budget = getBudgetForCategory(category.id, selectedCurrency)
                    const idealAmount = Number(budget?.ideal_amount || 0)
                    const realAmount = getCategoryExpense(category.id)

                    const ideal = getIdealPercentage(category.id)
                    const real = getRealPercentage(category.id)
                    const difference = real - ideal
                    const moneyDifference = realAmount - idealAmount

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-white/10 bg-input p-4 lg:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{category.name}</h3>

                            <p className="mt-1 text-sm text-textSecondary">
                              Ideal: {ideal}% · Real: {real}%
                            </p>

                            <p className="mt-1 text-sm text-primary">
                              Monto ideal:{" "}
                              {formatMoney(selectedCurrency, idealAmount)}
                            </p>

                            <p className="mt-1 text-sm text-textSecondary">
                              Gasto real:{" "}
                              {formatMoney(selectedCurrency, realAmount)}
                            </p>

                            <p
                              className={`mt-1 text-sm font-bold ${
                                moneyDifference > 0
                                  ? "text-red-400"
                                  : "text-secondary"
                              }`}
                            >
                              Desvío:{" "}
                              {moneyDifference > 0
                                ? `+${formatMoney(
                                    selectedCurrency,
                                    moneyDifference
                                  )}`
                                : formatMoney(
                                    selectedCurrency,
                                    moneyDifference
                                  )}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
                              difference > 5
                                ? "bg-red-500/10 text-red-400"
                                : difference >= -5
                                ? "bg-secondary/10 text-secondary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {difference > 0 ? `+${difference}%` : `${difference}%`}
                          </span>
                        </div>

                        <div className="mt-4 h-3 rounded-full bg-card">
                          <div
                            className={`h-3 rounded-full ${
                              difference > 5
                                ? "bg-red-400"
                                : difference >= -5
                                ? "bg-secondary"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(real, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Budget