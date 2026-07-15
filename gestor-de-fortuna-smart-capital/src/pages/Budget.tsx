  import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

type Category = {
  id: string
  user_id: string
  name: string
  created_at?: string
}

type BudgetRecord = {
  id: string
  user_id: string
  category_id: string
  ideal_amount?: number | null
  ideal_percentage?: number | null
  currency?: string | null
  categories?: {
    name?: string | null
  } | null
}

type Movement = {
  id: string
  user_id: string
  type: "gasto" | "ingreso" | "inversion" | "abono_deuda"
  amount: number
  currency: string
  category_id?: string | null
  movement_date: string
}

const BUDGET_CATEGORIES = [
  {
    name: "Supervivencia",
    suggestedPercentage: 40,
    description: "Vivienda, alimentación, servicios y necesidades esenciales.",
  },
  {
    name: "Educación",
    suggestedPercentage: 15,
    description: "Formación, aprendizaje y crecimiento profesional.",
  },
  {
    name: "Lujos",
    suggestedPercentage: 13,
    description: "Consumos opcionales y disfrute personal.",
  },
  {
    name: "Gastos Hormiga",
    suggestedPercentage: 2,
    description: "Pequeños gastos frecuentes y de bajo valor individual.",
  },
  {
    name: "Donativos",
    suggestedPercentage: 10,
    description: "Aportes, regalos y contribuciones voluntarias.",
  },
  {
    name: "Deuda",
    suggestedPercentage: 0,
    description: "Abonos realizados para reducir tus pasivos.",
  },
  {
    name: "Ahorro e Inversión",
    suggestedPercentage: 20,
    description: "Construcción de ahorro, inversión y patrimonio.",
  },
] as const

function normalizeName(value?: string | null) {
  return (value || "").trim().toLocaleLowerCase("es")
}

function Budget() {
  const currentDate = new Date()

  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<BudgetRecord[]>([])
  const [movements, setMovements] = useState<Movement[]>([])

  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [selectedCurrency, setSelectedCurrency] = useState("₡")

  const [objectiveDrafts, setObjectiveDrafts] = useState<
    Record<string, string>
  >({})
  const [savingCategoryId, setSavingCategoryId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchData()
  }, [month, year])

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}

    for (const category of categories) {
      const budget = getBudgetForCategory(
        category.id,
        selectedCurrency
      )

      nextDrafts[category.id] = String(
        Number(budget?.ideal_percentage || 0)
      )
    }

    setObjectiveDrafts(nextDrafts)
  }, [categories, budgets, selectedCurrency])

  async function getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error(error)
      return null
    }

    return user
  }

  async function fetchData() {
    const user = await getUser()
    if (!user) return

    setLoading(true)

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

    const [
      { data: categoriesData, error: categoriesError },
      { data: budgetsData, error: budgetsError },
      { data: movementsData, error: movementsError },
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("budgets")
        .select("*, categories(name)")
        .eq("user_id", user.id),

      supabase
        .from("movements")
        .select("*")
        .eq("user_id", user.id)
        .gte("movement_date", startDate)
        .lt("movement_date", endDate),
    ])

    if (categoriesError) {
      setLoading(false)
      alert(categoriesError.message)
      return
    }

    if (budgetsError) {
      setLoading(false)
      alert(budgetsError.message)
      return
    }

    if (movementsError) {
      setLoading(false)
      alert(movementsError.message)
      return
    }

    const orderedCategories = BUDGET_CATEGORIES.map((budgetCategory) =>
      (categoriesData || []).find(
        (category) =>
          normalizeName(category.name) ===
          normalizeName(budgetCategory.name)
      )
    ).filter(Boolean) as Category[]

    setCategories(orderedCategories)
    setBudgets((budgetsData || []) as BudgetRecord[])
    setMovements((movementsData || []) as Movement[])
    setLoading(false)
  }

  const availableCurrencies = useMemo(() => {
    return [
      ...new Set([
        "₡",
        "$",
        "€",
        ...movements.map((movement) => movement.currency),
        ...budgets.map((budget) => budget.currency || "₡"),
      ]),
    ].filter(Boolean)
  }, [movements, budgets])

  function getBudgetForCategory(
    categoryId: string,
    currency: string
  ) {
    return budgets.find(
      (budget) =>
        budget.category_id === categoryId &&
        (budget.currency || "₡") === currency
    )
  }

  function getCategoryConfig(categoryName: string) {
    return BUDGET_CATEGORIES.find(
      (item) =>
        normalizeName(item.name) === normalizeName(categoryName)
    )
  }

  async function saveObjectivePercentage(
    categoryId: string,
    percentage: number
  ) {
    const user = await getUser()
    if (!user) return

    const normalizedPercentage = Math.max(
      0,
      Math.min(Number(percentage || 0), 100)
    )

    const existingBudget = getBudgetForCategory(
      categoryId,
      selectedCurrency
    )

    const calculatedAmount =
      totalIncome > 0
        ? (totalIncome * normalizedPercentage) / 100
        : 0

    setSavingCategoryId(categoryId)

    if (existingBudget) {
      const { error } = await supabase
        .from("budgets")
        .update({
          ideal_percentage: normalizedPercentage,
          ideal_amount: calculatedAmount,
          currency: selectedCurrency,
        })
        .eq("id", existingBudget.id)
        .eq("user_id", user.id)

      if (error) {
        setSavingCategoryId("")
        alert(error.message)
        return
      }
    } else {
      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        category_id: categoryId,
        ideal_percentage: normalizedPercentage,
        ideal_amount: calculatedAmount,
        currency: selectedCurrency,
      })

      if (error) {
        setSavingCategoryId("")
        alert(error.message)
        return
      }
    }

    await fetchData()
    setSavingCategoryId("")
  }

  const currencyMovements = movements.filter(
    (movement) => movement.currency === selectedCurrency
  )

  const incomeMovements = currencyMovements.filter(
    (movement) => movement.type === "ingreso"
  )

  const outgoingMovements = currencyMovements.filter(
    (movement) =>
      movement.type === "gasto" ||
      movement.type === "inversion" ||
      movement.type === "abono_deuda"
  )

  const totalIncome = incomeMovements.reduce(
    (total, movement) => total + Number(movement.amount || 0),
    0
  )

  const totalOutgoing = outgoingMovements.reduce(
    (total, movement) => total + Number(movement.amount || 0),
    0
  )

  const availableMoney = totalIncome - totalOutgoing

  function getCategoryCurrentAmount(categoryId: string) {
    return outgoingMovements
      .filter((movement) => movement.category_id === categoryId)
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )
  }

  function getCurrentPercentage(categoryId: string) {
    if (totalIncome <= 0) return 0

    return (
      (getCategoryCurrentAmount(categoryId) / totalIncome) *
      100
    )
  }

  function getObjectivePercentage(categoryId: string) {
    const draftValue = objectiveDrafts[categoryId]

    if (draftValue !== undefined) {
      return Number(draftValue || 0)
    }

    const budget = getBudgetForCategory(
      categoryId,
      selectedCurrency
    )

    return Number(budget?.ideal_percentage || 0)
  }

  function formatPercentage(value: number) {
    return `${Number(value || 0).toLocaleString("es-CR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`
  }

  function formatMoney(currency: string, amount: number) {
    return `${currency}${Number(amount || 0).toLocaleString(
      "es-CR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`
  }

  const totalObjectivePercentage = categories.reduce(
    (total, category) =>
      total + getObjectivePercentage(category.id),
    0
  )

  const totalSuggestedPercentage = BUDGET_CATEGORIES.reduce(
    (total, category) =>
      total + category.suggestedPercentage,
    0
  )

  const currentDistributionPercentage =
    totalIncome > 0 ? (totalOutgoing / totalIncome) * 100 : 0

  const alignmentScore =
    categories.length === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            100 -
              categories.reduce((total, category) => {
                const objective =
                  getObjectivePercentage(category.id)
                const current = getCurrentPercentage(category.id)

                return total + Math.abs(objective - current)
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

  const cardClass =
    "rounded-3xl border border-white/10 bg-card p-5 lg:p-6"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-bold">
              Mi{" "}
              <span className="text-primary">
                Presupuesto Ideal
              </span>
            </h1>

            <p className="mt-1 text-sm text-textSecondary">
              Compara la recomendación de Smart Capital, tu estado
              actual y el objetivo que deseas alcanzar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCurrency}
              onChange={(event) =>
                setSelectedCurrency(event.target.value)
              }
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
              onChange={(event) =>
                setMonth(Number(event.target.value))
              }
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
              onChange={(event) =>
                setYear(Number(event.target.value))
              }
              type="number"
              className={`${inputClass} sm:w-28`}
            />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <section className="mb-6 rounded-3xl border border-secondary/20 bg-card p-5 lg:p-7">
            <p className="text-sm font-bold uppercase tracking-wider text-secondary">
              Ingreso del período
            </p>

            <h2 className="mt-2 break-words text-4xl font-bold text-secondary lg:text-5xl">
              {formatMoney(selectedCurrency, totalIncome)}
            </h2>

            <p className="mt-3 text-sm text-textSecondary">
              Este ingreso es la base para calcular la distribución
              porcentual de tu presupuesto.
            </p>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClass}>
              <p className="text-sm text-textSecondary">
                Salidas del período
              </p>

              <h2 className="mt-2 break-words text-3xl font-bold text-red-400">
                {formatMoney(selectedCurrency, totalOutgoing)}
              </h2>

              <p className="mt-2 text-sm text-textSecondary">
                {formatPercentage(currentDistributionPercentage)} del
                ingreso
              </p>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">
                Disponible
              </p>

              <h2
                className={`mt-2 break-words text-3xl font-bold ${
                  availableMoney >= 0
                    ? "text-primary"
                    : "text-red-400"
                }`}
              >
                {formatMoney(selectedCurrency, availableMoney)}
              </h2>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">
                Objetivo asignado
              </p>

              <h2
                className={`mt-2 text-3xl font-bold ${
                  totalObjectivePercentage === 100
                    ? "text-secondary"
                    : totalObjectivePercentage > 100
                      ? "text-red-400"
                      : "text-primary"
                }`}
              >
                {formatPercentage(totalObjectivePercentage)}
              </h2>

              <p className="mt-2 text-sm text-textSecondary">
                {totalObjectivePercentage === 100
                  ? "Tu objetivo está completamente distribuido."
                  : totalObjectivePercentage < 100
                    ? `Falta asignar ${formatPercentage(
                        100 - totalObjectivePercentage
                      )}.`
                    : `Excede por ${formatPercentage(
                        totalObjectivePercentage - 100
                      )}.`}
              </p>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-textSecondary">
                Alineación con mi objetivo
              </p>

              <h2
                className={`mt-2 text-3xl font-bold ${
                  alignmentScore >= 80
                    ? "text-secondary"
                    : alignmentScore >= 60
                      ? "text-primary"
                      : "text-red-400"
                }`}
              >
                {alignmentScore}%
              </h2>
            </div>
          </section>

          {totalIncome === 0 && (
            <section className="mb-6 rounded-3xl border border-amber-400/30 bg-amber-400/5 p-5 lg:p-6">
              <p className="font-bold text-amber-300">
                No existen ingresos registrados en{" "}
                {selectedCurrency} para este período.
              </p>

              <p className="mt-2 text-sm text-textSecondary">
                Puedes definir tus objetivos, pero el estado actual
                permanecerá en 0% hasta que registres ingresos.
              </p>
            </section>
          )}
                    <section className="rounded-3xl border border-primary/20 bg-card p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Mi Presupuesto Ideal
                </h2>

                <p className="mt-2 text-sm text-textSecondary">
                  Compara el modelo sugerido, tu comportamiento
                  financiero actual y tu objetivo personal.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                  Sugerido: {totalSuggestedPercentage}%
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-sm font-bold ${
                    totalObjectivePercentage === 100
                      ? "border-secondary/30 bg-secondary/10 text-secondary"
                      : totalObjectivePercentage > 100
                        ? "border-red-400/30 bg-red-400/10 text-red-400"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  Mi objetivo:{" "}
                  {formatPercentage(totalObjectivePercentage)}
                </span>
              </div>
            </div>

            {loading ? (
              <p className="mt-8 text-textSecondary">
                Cargando presupuesto...
              </p>
            ) : categories.length === 0 ? (
              <p className="mt-8 text-textSecondary">
                No se encontraron las partidas oficiales de Smart
                Capital.
              </p>
            ) : (
              <div className="mt-8 overflow-x-auto">
                <div className="min-w-[880px]">
                  <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-4 pb-4">
                    <p className="text-sm font-bold text-textSecondary">
                      Partida
                    </p>

                    <p className="text-center text-sm font-bold text-primary">
                      Smart Capital
                    </p>

                    <p className="text-center text-sm font-bold text-secondary">
                      Estado actual
                    </p>

                    <p className="text-center text-sm font-bold text-white">
                      Mi objetivo
                    </p>
                  </div>

                  <div className="divide-y divide-white/10">
                    {categories.map((category) => {
                      const config = getCategoryConfig(
                        category.name
                      )

                      const suggestedPercentage =
                        config?.suggestedPercentage || 0

                      const currentAmount =
                        getCategoryCurrentAmount(category.id)

                      const currentPercentage =
                        getCurrentPercentage(category.id)

                      const objectivePercentage =
                        getObjectivePercentage(category.id)

                      const suggestedAmount =
                        totalIncome > 0
                          ? (totalIncome *
                              suggestedPercentage) /
                            100
                          : 0

                      const objectiveAmount =
                        totalIncome > 0
                          ? (totalIncome *
                              objectivePercentage) /
                            100
                          : 0

                      const difference =
                        currentPercentage -
                        objectivePercentage

                      const isSaving =
                        savingCategoryId === category.id

                      return (
                        <article
                          key={category.id}
                          className="grid grid-cols-[1.35fr_1fr_1fr_1fr] gap-3 px-4 py-5"
                        >
                          <div className="pr-4">
                            <h3 className="font-bold text-white">
                              {category.name}
                            </h3>

                            <p className="mt-1 text-xs leading-relaxed text-textSecondary">
                              {config?.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                            <p className="text-2xl font-bold text-primary">
                              {formatPercentage(
                                suggestedPercentage
                              )}
                            </p>

                            <p className="mt-2 break-words text-xs text-textSecondary">
                              {formatMoney(
                                selectedCurrency,
                                suggestedAmount
                              )}
                            </p>
                          </div>

                          <div
                            className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center ${
                              difference > 5
                                ? "border-red-400/30 bg-red-400/5"
                                : Math.abs(difference) <= 5
                                  ? "border-secondary/30 bg-secondary/5"
                                  : "border-primary/20 bg-primary/5"
                            }`}
                          >
                            <p
                              className={`text-2xl font-bold ${
                                difference > 5
                                  ? "text-red-400"
                                  : Math.abs(difference) <= 5
                                    ? "text-secondary"
                                    : "text-primary"
                              }`}
                            >
                              {formatPercentage(
                                currentPercentage
                              )}
                            </p>

                            <p className="mt-2 break-words text-xs text-textSecondary">
                              {formatMoney(
                                selectedCurrency,
                                currentAmount
                              )}
                            </p>

                            <p
                              className={`mt-2 text-xs font-bold ${
                                difference > 0
                                  ? "text-red-400"
                                  : difference < 0
                                    ? "text-primary"
                                    : "text-secondary"
                              }`}
                            >
                              {difference > 0
                                ? `+${formatPercentage(
                                    difference
                                  )} sobre mi objetivo`
                                : difference < 0
                                  ? `${formatPercentage(
                                      Math.abs(difference)
                                    )} debajo de mi objetivo`
                                  : "Alineado con mi objetivo"}
                            </p>
                          </div>

                          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-input p-4">
                            <div className="flex w-full items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={
                                  objectiveDrafts[
                                    category.id
                                  ] ?? "0"
                                }
                                onChange={(event) => {
                                  const value =
                                    event.target.value

                                  setObjectiveDrafts(
                                    (current) => ({
                                      ...current,
                                      [category.id]: value,
                                    })
                                  )
                                }}
                                onBlur={(event) =>
                                  void saveObjectivePercentage(
                                    category.id,
                                    Number(
                                      event.target.value || 0
                                    )
                                  )
                                }
                                disabled={isSaving}
                                className="w-full rounded-xl border border-white/10 bg-card px-3 py-3 text-center text-lg font-bold text-white outline-none focus:border-primary/60 disabled:opacity-50"
                              />

                              <span className="font-bold text-textSecondary">
                                %
                              </span>
                            </div>

                            <p className="mt-3 break-words text-center text-xs text-textSecondary">
                              {formatMoney(
                                selectedCurrency,
                                objectiveAmount
                              )}
                            </p>

                            {isSaving && (
                              <p className="mt-2 text-xs font-bold text-primary">
                                Guardando...
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {categories
              .map((category) => {
                const current =
                  getCurrentPercentage(category.id)
                const objective =
                  getObjectivePercentage(category.id)
                const difference = current - objective

                return {
                  category,
                  current,
                  objective,
                  difference,
                }
              })
              .sort(
                (first, second) =>
                  Math.abs(second.difference) -
                  Math.abs(first.difference)
              )
              .slice(0, 3)
              .map(
                ({
                  category,
                  current,
                  objective,
                  difference,
                }) => (
                  <article
                    key={category.id}
                    className={`rounded-3xl border p-5 lg:p-6 ${
                      difference > 5
                        ? "border-red-400/30 bg-red-400/5"
                        : difference < -5
                          ? "border-primary/20 bg-primary/5"
                          : "border-secondary/20 bg-secondary/5"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-wider text-textSecondary">
                      Análisis
                    </p>

                    <h3 className="mt-2 text-lg font-bold">
                      {category.name}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-textSecondary">
                      {totalIncome <= 0
                        ? "Registra ingresos para activar el análisis de esta partida."
                        : difference > 5
                          ? `Tu estado actual es ${formatPercentage(
                              current
                            )}, por encima de tu objetivo de ${formatPercentage(
                              objective
                            )}. Conviene revisar esta partida.`
                          : difference < -5
                            ? `Tu estado actual es ${formatPercentage(
                                current
                              )}, por debajo de tu objetivo de ${formatPercentage(
                                objective
                              )}. Verifica si deseas reasignar ese margen.`
                            : `Tu estado actual está alineado con el objetivo definido para esta partida.`}
                    </p>
                  </article>
                )
              )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default Budget