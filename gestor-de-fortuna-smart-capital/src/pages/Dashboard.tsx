 import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

type MovementType =
  | "gasto"
  | "ingreso"
  | "inversion"
  | "abono_deuda"

type MasterCategoryConfig = {
  name: string
  suggestedPercentage: number
  description: string
}

const MASTER_CATEGORIES: MasterCategoryConfig[] = [
  {
    name: "Supervivencia",
    suggestedPercentage: 40,
    description: "Necesidades esenciales y estabilidad básica.",
  },
  {
    name: "Educación",
    suggestedPercentage: 15,
    description: "Aprendizaje, formación y desarrollo profesional.",
  },
  {
    name: "Lujos",
    suggestedPercentage: 13,
    description: "Consumos opcionales y disfrute personal.",
  },
  {
    name: "Gastos Hormiga",
    suggestedPercentage: 2,
    description: "Pequeños gastos frecuentes de bajo valor.",
  },
  {
    name: "Donativos",
    suggestedPercentage: 10,
    description: "Aportes, regalos y contribuciones voluntarias.",
  },
  {
    name: "Deuda",
    suggestedPercentage: 0,
    description: "Abonos destinados a reducir tus pasivos.",
  },
  {
    name: "Ahorro e Inversión",
    suggestedPercentage: 20,
    description: "Construcción de patrimonio y seguridad futura.",
  },
]

function normalizeName(value?: string | null) {
  return (value || "").trim().toLocaleLowerCase("es")
}

function Dashboard() {
  const currentDate = new Date()

  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [showHistorical, setShowHistorical] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("₡")

  const [movements, setMovements] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [profileName, setProfileName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchData()
  }, [month, year, showHistorical])

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

    await Promise.all([
      fetchProfile(user.id),
      fetchMovements(user.id),
      fetchAssets(user.id),
      fetchInvestments(user.id),
      fetchLiabilities(user.id),
      fetchPaymentMethods(user.id),
      fetchCategories(user.id),
      fetchBudgets(user.id),
    ])

    setLoading(false)
  }

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

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
      .order("created_at", { ascending: false })

    if (!showHistorical) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

      query = query
        .gte("movement_date", startDate)
        .lt("movement_date", endDate)
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

  async function fetchPaymentMethods(userId: string) {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setPaymentMethods(data || [])
  }

  async function fetchCategories(userId: string) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      alert(error.message)
      return
    }

    setCategories(data || [])
  }

  async function fetchBudgets(userId: string) {
    const { data, error } = await supabase
      .from("budgets")
      .select("*, categories(name)")
      .eq("user_id", userId)

    if (error) {
      alert(error.message)
      return
    }

    setBudgets(data || [])
  }

  const officialCategories = useMemo(() => {
    return MASTER_CATEGORIES.map((config) => {
      const category = categories.find(
        (item) =>
          normalizeName(item.name) === normalizeName(config.name)
      )

      return category
        ? {
            ...category,
            suggestedPercentage: config.suggestedPercentage,
            description: config.description,
          }
        : null
    }).filter(Boolean) as any[]
  }, [categories])

  const usedCurrencies = useMemo(() => {
    return [
      ...new Set(
        [
          "₡",
          "$",
          "€",
          ...movements.map((item) => item.currency),
          ...assets.map((item) => item.currency),
          ...investments.map((item) => item.currency || "₡"),
          ...liabilities.map((item) => item.currency),
          ...budgets.map((item) => item.currency || "₡"),
          ...paymentMethods.map((item) => item.currency || "₡"),
        ].filter(Boolean)
      ),
    ]
  }, [
    movements,
    assets,
    investments,
    liabilities,
    budgets,
    paymentMethods,
  ])

  useEffect(() => {
    if (
      usedCurrencies.length > 0 &&
      !usedCurrencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(usedCurrencies[0])
    }
  }, [usedCurrencies, selectedCurrency])

  function formatMoney(currency: string, amount: number) {
    return `${currency}${Number(amount || 0).toLocaleString("es-CR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  function formatPercentage(value: number) {
    return `${Number(value || 0).toLocaleString("es-CR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`
  }

  function getPaymentMethodLabel(method: any) {
    if (!method) return ""

    if (method.type === "efectivo") return "Efectivo"

    return `${method.bank || ""} ${method.brand || ""} ${
      method.type === "debito" ? "Débito" : "Crédito"
    }`
      .replace(/\s+/g, " ")
      .trim()
  }

  function getMovementTypeLabel(type: MovementType) {
    if (type === "ingreso") return "Ingreso"
    if (type === "gasto") return "Gasto"
    if (type === "inversion") return "Inversión"
    if (type === "abono_deuda") return "Abono deuda"

    return type
  }

  function getTotalsByCurrency(currency: string) {
    const currencyMovements = movements.filter(
      (movement) => movement.currency === currency
    )

    const ingresos = currencyMovements
      .filter((movement) => movement.type === "ingreso")
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )

    const gastos = currencyMovements
      .filter((movement) => movement.type === "gasto")
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )

    const inversionesRealizadas = currencyMovements
      .filter((movement) => movement.type === "inversion")
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )

    const abonosDeuda = currencyMovements
      .filter((movement) => movement.type === "abono_deuda")
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )

    const totalAssets = assets
      .filter((item) => item.currency === currency)
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      )

    const totalInvestments = investments
      .filter((item) => (item.currency || "₡") === currency)
      .reduce(
        (total, item) => total + Number(item.current_value || 0),
        0
      )

    const totalLiabilities = liabilities
      .filter((item) => item.currency === currency)
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      )

    const totalOutgoing =
      gastos + inversionesRealizadas + abonosDeuda

    const capitalDisponible = ingresos - totalOutgoing

    const patrimonioNeto =
      capitalDisponible +
      totalAssets +
      totalInvestments -
      totalLiabilities

    const ahorroRealPercentage =
      ingresos > 0
        ? ((inversionesRealizadas + Math.max(capitalDisponible, 0)) /
            ingresos) *
          100
        : 0

    return {
      ingresos,
      gastos,
      inversionesRealizadas,
      abonosDeuda,
      totalOutgoing,
      capitalDisponible,
      activos: totalAssets,
      inversiones: totalInvestments,
      pasivos: totalLiabilities,
      patrimonioNeto,
      ahorroRealPercentage,
    }
  }

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

  function getCategoryCurrentAmount(
    categoryId: string,
    currency: string
  ) {
    return movements
      .filter(
        (movement) =>
          movement.currency === currency &&
          movement.category_id === categoryId &&
          movement.type !== "ingreso"
      )
      .reduce(
        (total, movement) => total + Number(movement.amount || 0),
        0
      )
  }

  function getCategoryCurrentPercentage(
    categoryId: string,
    currency: string
  ) {
    const totals = getTotalsByCurrency(currency)

    if (totals.ingresos <= 0) return 0

    return (
      (getCategoryCurrentAmount(categoryId, currency) /
        totals.ingresos) *
      100
    )
  }

  function getCategoryObjectivePercentage(
    categoryId: string,
    currency: string
  ) {
    const budget = getBudgetForCategory(categoryId, currency)

    return Number(budget?.ideal_percentage || 0)
  }

  const incomeBySubcategory = useMemo(() => {
    return movements
      .filter((movement) => movement.type === "ingreso")
      .reduce((result: Record<string, any>, movement) => {
        const subcategoryName =
          movement.subcategories?.name || "Sin subpartida"

        const key = `${movement.currency}-${subcategoryName}`

        result[key] = {
          currency: movement.currency,
          subcategory: subcategoryName,
          amount:
            Number(result[key]?.amount || 0) +
            Number(movement.amount || 0),
        }

        return result
      }, {})
  }, [movements])

  const distributionByCategory = useMemo(() => {
    return movements
      .filter((movement) => movement.type !== "ingreso")
      .reduce((result: Record<string, any>, movement) => {
        const categoryName =
          movement.categories?.name || "Sin partida"

        const key = `${movement.currency}-${categoryName}`

        result[key] = {
          currency: movement.currency,
          category: categoryName,
          amount:
            Number(result[key]?.amount || 0) +
            Number(movement.amount || 0),
        }

        return result
      }, {})
  }, [movements])

  const creditCards = paymentMethods.filter(
    (method) => method.type === "credito"
  )

  const creditCardTotalsByCurrency = creditCards.reduce(
    (result: Record<string, number>, method) => {
      const currency = method.currency || "₡"

      result[currency] =
        Number(result[currency] || 0) +
        Number(method.current_balance || 0)

      return result
    },
    {}
  )

  const maxIncomeBySubcategory = Math.max(
    ...Object.values(incomeBySubcategory).map(
      (item: any) => Number(item.amount || 0)
    ),
    1
  )

  const maxDistributionByCategory = Math.max(
    ...Object.values(distributionByCategory).map(
      (item: any) => Number(item.amount || 0)
    ),
    1
  )

  const selectedTotals = getTotalsByCurrency(selectedCurrency)

  const budgetRows = officialCategories.map((category) => {
    const currentPercentage = getCategoryCurrentPercentage(
      category.id,
      selectedCurrency
    )

    const objectivePercentage = getCategoryObjectivePercentage(
      category.id,
      selectedCurrency
    )

    return {
      ...category,
      currentPercentage,
      objectivePercentage,
      differenceFromObjective:
        currentPercentage - objectivePercentage,
      differenceFromSuggested:
        currentPercentage - category.suggestedPercentage,
    }
  })

  const budgetAlignmentScore =
    budgetRows.length === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            100 -
              budgetRows.reduce(
                (total, category) =>
                  total +
                  Math.abs(category.differenceFromObjective),
                0
              ) /
                budgetRows.length
          )
        )

  const totalObjectivePercentage = budgetRows.reduce(
    (total, category) =>
      total + Number(category.objectivePercentage || 0),
    0
  )

  const totalCardBalance = Number(
    creditCardTotalsByCurrency[selectedCurrency] || 0
  )

  const totalCardLimit = creditCards
    .filter(
      (method) => (method.currency || "₡") === selectedCurrency
    )
    .reduce(
      (total, method) =>
        total + Number(method.credit_limit || 0),
      0
    )

  const cardUsagePercentage =
    totalCardLimit > 0
      ? (totalCardBalance / totalCardLimit) * 100
      : 0

  const latestMovements = movements.slice(0, 10)

  const coachingMessages = useMemo(() => {
    const messages: Array<{
      title: string
      message: string
      type: "positive" | "warning" | "critical"
    }> = []

    if (selectedTotals.ingresos <= 0) {
      messages.push({
        title: "Registra tus ingresos",
        message:
          "Necesitas ingresos en esta moneda para activar el análisis presupuestario.",
        type: "warning",
      })

      return messages
    }

    const largestDeviation = [...budgetRows].sort(
      (first, second) =>
        Math.abs(second.differenceFromObjective) -
        Math.abs(first.differenceFromObjective)
    )[0]

    if (
      largestDeviation &&
      largestDeviation.differenceFromObjective > 5
    ) {
      messages.push({
        title: `Revisa ${largestDeviation.name}`,
        message: `Tu estado actual supera el objetivo por ${formatPercentage(
          largestDeviation.differenceFromObjective
        )}.`,
        type: "critical",
      })
    }

    const investmentCategory = budgetRows.find(
      (category) =>
        normalizeName(category.name) ===
        normalizeName("Ahorro e Inversión")
    )

    if (
      investmentCategory &&
      investmentCategory.currentPercentage <
        investmentCategory.objectivePercentage - 5
    ) {
      messages.push({
        title: "Ahorro e inversión por debajo del objetivo",
        message: `Actualmente destinas ${formatPercentage(
          investmentCategory.currentPercentage
        )} y tu objetivo es ${formatPercentage(
          investmentCategory.objectivePercentage
        )}.`,
        type: "warning",
      })
    }

    if (selectedTotals.capitalDisponible < 0) {
      messages.push({
        title: "Tus salidas superan los ingresos",
        message:
          "El capital disponible del período es negativo. Conviene reducir salidas o aumentar ingresos.",
        type: "critical",
      })
    }

    if (cardUsagePercentage >= 70) {
      messages.push({
        title: "Uso elevado de tarjetas",
        message: `Estás utilizando ${formatPercentage(
          cardUsagePercentage
        )} del límite de crédito disponible.`,
        type: "critical",
      })
    }

    if (
      budgetAlignmentScore >= 80 &&
      selectedTotals.capitalDisponible >= 0
    ) {
      messages.push({
        title: "Buen control financiero",
        message:
          "Tu distribución actual está bien alineada con los objetivos definidos.",
        type: "positive",
      })
    }

    if (messages.length === 0) {
      messages.push({
        title: "Continúa registrando movimientos",
        message:
          "Con más información Smart Capital podrá ofrecer recomendaciones más precisas.",
        type: "positive",
      })
    }

    return messages.slice(0, 4)
  }, [
    budgetRows,
    selectedTotals,
    cardUsagePercentage,
    budgetAlignmentScore,
    selectedCurrency,
  ])

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
              Dashboard{" "}
              <span className="text-primary">
                Financiero
              </span>
            </h1>

            <p className="mt-1 text-sm text-textSecondary">
              {showHistorical
                ? "Resumen histórico total de tus finanzas."
                : "Resumen financiero y presupuestario del período."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!showHistorical && (
              <>
                <select
                  value={month}
                  onChange={(event) =>
                    setMonth(Number(event.target.value))
                  }
                  className={inputClass}
                >
                  {months.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
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
              </>
            )}

            <button
              type="button"
              onClick={() =>
                setShowHistorical(!showHistorical)
              }
              className={`rounded-xl px-5 py-3 font-bold ${
                showHistorical
                  ? "bg-primary text-white"
                  : "border border-primary/40 text-primary"
              }`}
            >
              {showHistorical
                ? "Volver a mensual"
                : "Histórico total"}
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <section className="mb-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-7">
            <h2 className="text-2xl font-bold lg:text-3xl">
              Hola{" "}
              <span className="text-primary">
                {profileName || "👋"}
              </span>
            </h2>

            <p className="mt-3 text-sm text-textSecondary lg:text-base">
              Analiza tu patrimonio, presupuesto, liquidez, deuda,
              inversión y uso de tarjetas desde un solo lugar.
            </p>
          </section>

          {loading ? (
            <section className={cardClass}>
              <p className="text-textSecondary">
                Cargando tu información financiera...
              </p>
            </section>
          ) : usedCurrencies.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-card p-8 text-center lg:p-10">
              <p className="text-textSecondary">
                No hay datos registrados para este período.
              </p>
            </section>
          ) : (
            <>
              <section className="mb-8">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold lg:text-2xl">
                      Resumen patrimonial
                    </h2>

                    <p className="mt-1 text-sm text-textSecondary">
                      Cada moneda se analiza de forma independiente.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  {usedCurrencies.map((currency) => {
                    const totals =
                      getTotalsByCurrency(currency)

                    return (
                      <article
                        key={currency}
                        className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6"
                      >
                        <h3 className="text-xl font-bold">
                          Patrimonio en {currency}
                        </h3>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm text-textSecondary">
                              Patrimonio neto
                            </p>

                            <p
                              className={`mt-2 break-words text-2xl font-bold ${
                                totals.patrimonioNeto >= 0
                                  ? "text-primary"
                                  : "text-red-400"
                              }`}
                            >
                              {formatMoney(
                                currency,
                                totals.patrimonioNeto
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                            <p className="text-sm text-textSecondary">
                              Capital disponible
                            </p>

                            <p
                              className={`mt-2 break-words text-2xl font-bold ${
                                totals.capitalDisponible >= 0
                                  ? "text-secondary"
                                  : "text-red-400"
                              }`}
                            >
                              {formatMoney(
                                currency,
                                totals.capitalDisponible
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Activos
                            </p>

                            <p className="mt-2 break-words text-2xl font-bold text-secondary">
                              {formatMoney(
                                currency,
                                totals.activos
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Inversiones
                            </p>

                            <p className="mt-2 break-words text-2xl font-bold text-primary">
                              {formatMoney(
                                currency,
                                totals.inversiones
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
                            <p className="text-sm text-textSecondary">
                              Pasivos
                            </p>

                            <p className="mt-2 break-words text-2xl font-bold text-red-400">
                              {formatMoney(
                                currency,
                                totals.pasivos
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Ingresos
                            </p>

                            <p className="mt-2 text-xl font-bold text-secondary">
                              {formatMoney(
                                currency,
                                totals.ingresos
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Gastos
                            </p>

                            <p className="mt-2 text-xl font-bold text-red-400">
                              {formatMoney(
                                currency,
                                totals.gastos
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Inversiones realizadas
                            </p>

                            <p className="mt-2 text-xl font-bold text-primary">
                              {formatMoney(
                                currency,
                                totals.inversionesRealizadas
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-input p-4">
                            <p className="text-sm text-textSecondary">
                              Abonos de deuda
                            </p>

                            <p className="mt-2 text-xl font-bold text-red-400">
                              {formatMoney(
                                currency,
                                totals.abonosDeuda
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
                            <section className="mb-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Estado de mi presupuesto
                    </h2>

                    <p className="mt-2 text-sm text-textSecondary">
                      Compara tu estado actual con el objetivo definido
                      en Mi Presupuesto Ideal.
                    </p>
                  </div>

                  <select
                    value={selectedCurrency}
                    onChange={(event) =>
                      setSelectedCurrency(event.target.value)
                    }
                    className={inputClass}
                  >
                    {usedCurrencies.map((currency) => (
                      <option
                        key={currency}
                        value={currency}
                      >
                        Moneda {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                    <p className="text-sm text-textSecondary">
                      Ingreso del período
                    </p>

                    <p className="mt-2 break-words text-2xl font-bold text-secondary">
                      {formatMoney(
                        selectedCurrency,
                        selectedTotals.ingresos
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-input p-4">
                    <p className="text-sm text-textSecondary">
                      Objetivo asignado
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
                        totalObjectivePercentage === 100
                          ? "text-secondary"
                          : totalObjectivePercentage > 100
                            ? "text-red-400"
                            : "text-primary"
                      }`}
                    >
                      {formatPercentage(
                        totalObjectivePercentage
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-input p-4">
                    <p className="text-sm text-textSecondary">
                      Alineación
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
                        budgetAlignmentScore >= 80
                          ? "text-secondary"
                          : budgetAlignmentScore >= 60
                            ? "text-primary"
                            : "text-red-400"
                      }`}
                    >
                      {budgetAlignmentScore}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-input p-4">
                    <p className="text-sm text-textSecondary">
                      Ahorro real estimado
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
                        selectedTotals.ahorroRealPercentage >= 20
                          ? "text-secondary"
                          : "text-primary"
                      }`}
                    >
                      {formatPercentage(
                        selectedTotals.ahorroRealPercentage
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-8 overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[1.25fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-4 pb-4">
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
                      {budgetRows.map((category) => (
                        <article
                          key={category.id}
                          className="grid grid-cols-[1.25fr_1fr_1fr_1fr] gap-3 px-4 py-4"
                        >
                          <div className="flex flex-col justify-center">
                            <p className="font-bold text-white">
                              {category.name}
                            </p>

                            <p className="mt-1 text-xs text-textSecondary">
                              {category.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-3">
                            <p className="text-lg font-bold text-primary">
                              {formatPercentage(
                                category.suggestedPercentage
                              )}
                            </p>
                          </div>

                          <div
                            className={`flex items-center justify-center rounded-xl border p-3 ${
                              category.differenceFromObjective > 5
                                ? "border-red-400/30 bg-red-400/5"
                                : Math.abs(
                                      category.differenceFromObjective
                                    ) <= 5
                                  ? "border-secondary/30 bg-secondary/5"
                                  : "border-primary/20 bg-primary/5"
                            }`}
                          >
                            <p
                              className={`text-lg font-bold ${
                                category.differenceFromObjective > 5
                                  ? "text-red-400"
                                  : Math.abs(
                                        category.differenceFromObjective
                                      ) <= 5
                                    ? "text-secondary"
                                    : "text-primary"
                              }`}
                            >
                              {formatPercentage(
                                category.currentPercentage
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-input p-3">
                            <p className="text-lg font-bold text-white">
                              {formatPercentage(
                                category.objectivePercentage
                              )}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">
                    Recomendaciones Smart Capital
                  </h2>

                  <p className="mt-2 text-sm text-textSecondary">
                    Alertas generadas a partir de tu presupuesto,
                    liquidez, deuda y uso de crédito.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {coachingMessages.map((item, index) => (
                    <article
                      key={`${item.title}-${index}`}
                      className={`rounded-3xl border p-5 ${
                        item.type === "critical"
                          ? "border-red-400/30 bg-red-400/5"
                          : item.type === "warning"
                            ? "border-amber-400/30 bg-amber-400/5"
                            : "border-secondary/20 bg-secondary/5"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold uppercase tracking-wider ${
                          item.type === "critical"
                            ? "text-red-400"
                            : item.type === "warning"
                              ? "text-amber-300"
                              : "text-secondary"
                        }`}
                      >
                        {item.type === "critical"
                          ? "Atención"
                          : item.type === "warning"
                            ? "Recomendación"
                            : "Buen avance"}
                      </p>

                      <h3 className="mt-2 text-lg font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-textSecondary">
                        {item.message}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mb-8 rounded-3xl border border-red-400/20 bg-card p-5 lg:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-red-400">
                      Tarjetas de crédito
                    </h2>

                    <p className="mt-2 text-sm text-textSecondary">
                      Los saldos se leen directamente desde el saldo
                      utilizado de cada tarjeta.
                    </p>
                  </div>

                  {Object.keys(creditCardTotalsByCurrency).length >
                    0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        creditCardTotalsByCurrency
                      ).map(([currency, amount]) => (
                        <span
                          key={currency}
                          className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-400"
                        >
                          {formatMoney(currency, amount)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {creditCards.length === 0 ? (
                    <p className="text-textSecondary">
                      No tienes tarjetas de crédito registradas.
                    </p>
                  ) : (
                    creditCards.map((method) => {
                      const currency = method.currency || "₡"
                      const limit = Number(
                        method.credit_limit || 0
                      )
                      const balance = Number(
                        method.current_balance || 0
                      )
                      const available = Math.max(
                        limit - balance,
                        0
                      )
                      const usage =
                        limit > 0
                          ? (balance / limit) * 100
                          : 0

                      return (
                        <article
                          key={method.id}
                          className="rounded-2xl border border-white/10 bg-input p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-white">
                                {method.name}
                              </h3>

                              <p className="mt-1 text-sm text-textSecondary">
                                {method.bank || "Banco no indicado"}
                                {method.brand
                                  ? ` · ${method.brand}`
                                  : ""}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                usage >= 80
                                  ? "bg-red-400/10 text-red-400"
                                  : usage >= 50
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              {formatPercentage(usage)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <div>
                              <p className="text-textSecondary">
                                Límite
                              </p>

                              <p className="mt-1 break-words font-bold">
                                {formatMoney(currency, limit)}
                              </p>
                            </div>

                            <div>
                              <p className="text-textSecondary">
                                Utilizado
                              </p>

                              <p className="mt-1 break-words font-bold text-red-400">
                                {formatMoney(currency, balance)}
                              </p>
                            </div>

                            <div>
                              <p className="text-textSecondary">
                                Disponible
                              </p>

                              <p className="mt-1 break-words font-bold text-secondary">
                                {formatMoney(
                                  currency,
                                  available
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-card">
                            <div
                              className={`h-full rounded-full ${
                                usage >= 80
                                  ? "bg-red-400"
                                  : usage >= 50
                                    ? "bg-primary"
                                    : "bg-secondary"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.max(usage, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="mb-8 grid gap-6 lg:grid-cols-2">
                <div className={cardClass}>
                  <h3 className="text-xl font-bold">
                    Ingresos por subpartida
                  </h3>

                  <div className="mt-6 space-y-4">
                    {Object.keys(incomeBySubcategory).length ===
                    0 ? (
                      <p className="text-textSecondary">
                        No hay ingresos registrados en este
                        período.
                      </p>
                    ) : (
                      Object.values(incomeBySubcategory).map(
                        (item: any) => (
                          <div
                            key={`${item.currency}-${item.subcategory}`}
                          >
                            <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                              <span>
                                {item.subcategory}
                              </span>

                              <span className="font-bold text-secondary">
                                {formatMoney(
                                  item.currency,
                                  item.amount
                                )}
                              </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-input">
                              <div
                                className="h-full rounded-full bg-secondary"
                                style={{
                                  width: `${
                                    (item.amount /
                                      maxIncomeBySubcategory) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>

                <div className={cardClass}>
                  <h3 className="text-xl font-bold">
                    Distribución por partida
                  </h3>

                  <p className="mt-2 text-sm text-textSecondary">
                    Incluye gastos, inversiones y abonos de deuda.
                  </p>

                  <div className="mt-6 space-y-4">
                    {Object.keys(distributionByCategory).length ===
                    0 ? (
                      <p className="text-textSecondary">
                        No hay salidas registradas en este período.
                      </p>
                    ) : (
                      Object.values(distributionByCategory).map(
                        (item: any) => (
                          <div
                            key={`${item.currency}-${item.category}`}
                          >
                            <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                              <span>{item.category}</span>

                              <span className="font-bold text-primary">
                                {formatMoney(
                                  item.currency,
                                  item.amount
                                )}
                              </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-input">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${
                                    (item.amount /
                                      maxDistributionByCategory) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
                <h3 className="text-xl font-bold">
                  Últimos 10 movimientos
                </h3>

                <div className="mt-6 space-y-4">
                  {latestMovements.length === 0 ? (
                    <p className="text-textSecondary">
                      No hay movimientos para mostrar.
                    </p>
                  ) : (
                    latestMovements.map((movement) => (
                      <article
                        key={movement.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-input p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-bold">
                            {getMovementTypeLabel(
                              movement.type
                            )}

                            {movement.categories?.name &&
                              ` · ${movement.categories.name}`}

                            {movement.subcategories?.name &&
                              ` / ${movement.subcategories.name}`}
                          </p>

                          <p className="mt-1 text-sm text-textSecondary/70">
                            {movement.movement_date}
                          </p>

                          {movement.investments && (
                            <p className="mt-1 break-words text-sm text-primary">
                              Inversión:{" "}
                              {movement.investments.name}
                            </p>
                          )}

                          {movement.liabilities && (
                            <p className="mt-1 break-words text-sm text-red-400">
                              Deuda:{" "}
                              {movement.liabilities.name}
                            </p>
                          )}

                          {movement.payment_methods && (
                            <p className="mt-1 break-words text-sm text-primary">
                              Medio de pago:{" "}
                              {getPaymentMethodLabel(
                                movement.payment_methods
                              )}
                            </p>
                          )}

                          {movement.description && (
                            <p className="mt-1 break-words text-sm text-textSecondary">
                              {movement.description}
                            </p>
                          )}
                        </div>

                        <p
                          className={`break-words text-xl font-bold ${
                            movement.type === "ingreso"
                              ? "text-secondary"
                              : movement.type === "inversion"
                                ? "text-primary"
                                : "text-red-400"
                          }`}
                        >
                          {formatMoney(
                            movement.currency,
                            movement.amount
                          )}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard