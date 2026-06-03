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

  useEffect(() => {
    fetchData()
  }, [month, year])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      .select("*")
      .eq("user_id", user.id)

    const { data: movementsData } = await supabase
      .from("movements")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "gasto")
      .gte("movement_date", startDate)
      .lt("movement_date", endDate)

    setCategories(categoriesData || [])
    setBudgets(budgetsData || [])
    setMovements(movementsData || [])
  }

  function getBudgetForCategory(categoryId: string) {
    return budgets.find((budget) => budget.category_id === categoryId)
  }

  async function saveBudget(categoryId: string, percentage: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const existingBudget = getBudgetForCategory(categoryId)

    if (existingBudget) {
      await supabase
        .from("budgets")
        .update({ ideal_percentage: percentage })
        .eq("id", existingBudget.id)
    } else {
      await supabase.from("budgets").insert({
        user_id: user.id,
        category_id: categoryId,
        ideal_percentage: percentage,
      })
    }

    fetchData()
  }

  const totalIdeal = budgets.reduce(
    (acc, budget) => acc + Number(budget.ideal_percentage),
    0
  )

  const totalExpenses = movements.reduce(
    (acc, movement) => acc + Number(movement.amount),
    0
  )

  function getRealPercentage(categoryId: string) {
    if (totalExpenses === 0) return 0

    const categoryExpense = movements
      .filter((movement) => movement.category_id === categoryId)
      .reduce((acc, movement) => acc + Number(movement.amount), 0)

    return Math.round((categoryExpense / totalExpenses) * 100)
  }

  const alignmentScore =
    categories.length === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            100 -
              categories.reduce((acc, category) => {
                const budget = getBudgetForCategory(category.id)
                const ideal = Number(budget?.ideal_percentage || 0)
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

  return (
    <div className="min-h-screen bg-[#121212] text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">
              Presupuesto <span className="text-[#E0B04B]">Ideal vs Real</span>
            </h1>

            <p className="text-sm text-gray-400">
              Compara tu presupuesto ideal contra tus gastos reales.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
            <p className="text-sm text-gray-400">
              Alineación con tu presupuesto ideal
            </p>

            <h2
              className={`mt-2 text-4xl font-bold lg:text-5xl ${
                alignmentScore >= 80
                  ? "text-green-400"
                  : alignmentScore >= 60
                  ? "text-[#E0B04B]"
                  : "text-red-400"
              }`}
            >
              {alignmentScore}%
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              {alignmentScore >= 80
                ? "Excelente. Tus gastos están bastante alineados con tu presupuesto ideal."
                : alignmentScore >= 60
                ? "Vas bien, pero hay partidas que necesitan ajustes."
                : "Tu gasto real está bastante alejado de tu presupuesto ideal."}
            </p>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
            <p className="text-sm text-gray-400">Total ideal asignado</p>

            <h2
              className={`mt-2 text-4xl font-bold ${
                totalIdeal === 100
                  ? "text-green-400"
                  : totalIdeal > 100
                  ? "text-red-400"
                  : "text-[#E0B04B]"
              }`}
            >
              {totalIdeal}%
            </h2>

            {totalIdeal < 100 && (
              <p className="mt-3 text-sm text-yellow-400">
                Aún te falta asignar {100 - totalIdeal}% de tu presupuesto ideal.
              </p>
            )}

            {totalIdeal === 100 && (
              <p className="mt-3 text-sm text-green-400">
                Excelente. Tu presupuesto ideal está balanceado en 100%.
              </p>
            )}

            {totalIdeal > 100 && (
              <p className="mt-3 text-sm text-red-400">
                Tu presupuesto supera el 100%. Debes reducir algunas partidas.
              </p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-5 lg:p-6">
              <h2 className="text-xl font-bold">Presupuesto ideal</h2>

              <div className="mt-6 space-y-5">
                {categories.length === 0 ? (
                  <p className="text-gray-400">
                    Primero debes crear partidas en Categorías.
                  </p>
                ) : (
                  categories.map((category) => {
                    const budget = getBudgetForCategory(category.id)
                    const percentage = budget?.ideal_percentage || 0

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{category.name}</h3>

                            <p className="mt-1 text-sm text-gray-400">
                              Ideal: {percentage}%
                            </p>
                          </div>

                          <input
                            type="number"
                            defaultValue={percentage}
                            onBlur={(e) =>
                              saveBudget(category.id, Number(e.target.value))
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 outline-none sm:w-28"
                          />
                        </div>

                        <div className="mt-4 h-3 rounded-full bg-[#1a1a1a]">
                          <div
                            className="h-3 rounded-full bg-[#E0B04B]"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 lg:p-6">
              <h2 className="text-xl font-bold">Presupuesto real</h2>

              <div className="mt-6 space-y-5">
                {categories.length === 0 ? (
                  <p className="text-gray-400">No hay partidas para analizar.</p>
                ) : (
                  categories.map((category) => {
                    const budget = getBudgetForCategory(category.id)
                    const ideal = Number(budget?.ideal_percentage || 0)
                    const real = getRealPercentage(category.id)
                    const difference = real - ideal

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-white/10 bg-[#111111] p-4 lg:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{category.name}</h3>

                            <p className="mt-1 text-sm text-gray-400">
                              Ideal: {ideal}% · Real: {real}%
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
                              difference > 5
                                ? "bg-red-500/10 text-red-400"
                                : difference >= -5
                                ? "bg-green-500/10 text-green-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {difference > 0 ? `+${difference}%` : `${difference}%`}
                          </span>
                        </div>

                        <div className="mt-4 h-3 rounded-full bg-[#1a1a1a]">
                          <div
                            className={`h-3 rounded-full ${
                              difference > 5
                                ? "bg-red-400"
                                : difference >= -5
                                ? "bg-green-400"
                                : "bg-yellow-400"
                            }`}
                            style={{ width: `${Math.min(real, 100)}%` }}
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