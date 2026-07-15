 import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

type MovementType = "gasto" | "ingreso" | "inversion" | "abono_deuda"

type Category = {
  id: string
  user_id: string
  name: string
  created_at?: string
}

type Subcategory = {
  id: string
  user_id: string
  category_id: string
  name: string
  created_at?: string
}

const MASTER_CATEGORY_NAMES = [
  "Ingreso",
  "Supervivencia",
  "Educación",
  "Lujos",
  "Gastos Hormiga",
  "Donativos",
  "Deuda",
  "Ahorro e Inversión",
] as const

const EXPENSE_CATEGORY_NAMES = [
  "Supervivencia",
  "Educación",
  "Lujos",
  "Gastos Hormiga",
  "Donativos",
] as const

const CATEGORY_ORDER = new Map(
  MASTER_CATEGORY_NAMES.map((name, index) => [
    name.toLocaleLowerCase("es"),
    index,
  ])
)

function normalizeName(value?: string | null) {
  return (value || "").trim().toLocaleLowerCase("es")
}

function Movements() {
  const today = new Date().toLocaleDateString("en-CA")

  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toLocaleDateString("en-CA")

  const currentDate = new Date()

  const [filterMonth, setFilterMonth] = useState(
    currentDate.getMonth() + 1
  )
  const [filterYear, setFilterYear] = useState(
    currentDate.getFullYear()
  )
  const [showHistorical, setShowHistorical] = useState(false)
  const [filterType, setFilterType] = useState("todos")
  const [filterCurrency, setFilterCurrency] = useState("todas")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSubcategory, setFilterSubcategory] = useState("")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("")

  const [editingId, setEditingId] = useState("")
  const [type, setType] = useState<MovementType>("gasto")
  const [currency, setCurrency] = useState("₡")
  const [customCurrency, setCustomCurrency] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>(
    []
  )
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [selectedInvestment, setSelectedInvestment] = useState("")
  const [selectedLiability, setSelectedLiability] = useState("")

  useEffect(() => {
    void initializePage()
  }, [])

  useEffect(() => {
    void fetchMovements()
  }, [
    filterMonth,
    filterYear,
    showHistorical,
    filterType,
    filterCurrency,
    filterCategory,
    filterSubcategory,
    filterPaymentMethod,
  ])

  async function initializePage() {
    await Promise.all([
      fetchCategories(),
      fetchSubcategories(),
      fetchPaymentMethods(),
      fetchInvestments(),
      fetchLiabilities(),
    ])
  }

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

  async function fetchCategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      alert(error.message)
      return
    }

    setCategories(data || [])
  }

  async function fetchSubcategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })

    if (error) {
      alert(error.message)
      return
    }

    setSubcategories(data || [])
  }

  async function fetchPaymentMethods() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setPaymentMethods(data || [])
  }

  async function fetchInvestments() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setInvestments(data || [])
  }

  async function fetchLiabilities() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setLiabilities(data || [])
  }

  async function fetchMovements() {
    const user = await getUser()
    if (!user) return

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
      .eq("user_id", user.id)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (!showHistorical) {
      const startDate = `${filterYear}-${String(filterMonth).padStart(
        2,
        "0"
      )}-01`

      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1
      const nextYear =
        filterMonth === 12 ? filterYear + 1 : filterYear

      const endDate = `${nextYear}-${String(nextMonth).padStart(
        2,
        "0"
      )}-01`

      query = query
        .gte("movement_date", startDate)
        .lt("movement_date", endDate)
    }

    if (filterType !== "todos") {
      query = query.eq("type", filterType)
    }

    if (filterCurrency !== "todas") {
      query = query.eq("currency", filterCurrency)
    }

    if (filterCategory) {
      query = query.eq("category_id", filterCategory)
    }

    if (filterSubcategory) {
      query = query.eq("subcategory_id", filterSubcategory)
    }

    if (filterPaymentMethod) {
      query = query.eq(
        "payment_method_id",
        filterPaymentMethod
      )
    }

    const { data, error } = await query

    if (error) {
      alert(error.message)
      return
    }

    setMovements(data || [])
  }

  const orderedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const firstOrder =
        CATEGORY_ORDER.get(normalizeName(a.name)) ?? 999
      const secondOrder =
        CATEGORY_ORDER.get(normalizeName(b.name)) ?? 999

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder
      }

      return a.name.localeCompare(b.name, "es")
    })
  }, [categories])

  function findCategoryByName(name: string) {
    return categories.find(
      (category) =>
        normalizeName(category.name) === normalizeName(name)
    )
  }

  const incomeCategory = findCategoryByName("Ingreso")
  const debtCategory = findCategoryByName("Deuda")
  const investmentCategory = findCategoryByName(
    "Ahorro e Inversión"
  )

  const expenseCategories = useMemo(() => {
    return orderedCategories.filter((category) =>
      EXPENSE_CATEGORY_NAMES.some(
        (name) =>
          normalizeName(name) === normalizeName(category.name)
      )
    )
  }, [orderedCategories])

  const masterCategories = useMemo(() => {
    return orderedCategories.filter((category) =>
      MASTER_CATEGORY_NAMES.some(
        (name) =>
          normalizeName(name) === normalizeName(category.name)
      )
    )
  }, [orderedCategories])

  const visibleCategories =
    type === "ingreso"
      ? incomeCategory
        ? [incomeCategory]
        : []
      : type === "gasto"
        ? expenseCategories
        : []

  const filterCategories =
    filterType === "ingreso"
      ? incomeCategory
        ? [incomeCategory]
        : []
      : filterType === "gasto"
        ? expenseCategories
        : filterType === "inversion"
          ? investmentCategory
            ? [investmentCategory]
            : []
          : filterType === "abono_deuda"
            ? debtCategory
              ? [debtCategory]
              : []
            : orderedCategories

  const formSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.category_id === selectedCategory
  )

  const filterSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.category_id === filterCategory
  )

  const finalCurrency =
    currency === "custom" ? customCurrency.trim() : currency

  useEffect(() => {
    if (type === "ingreso") {
      setSelectedCategory(incomeCategory?.id || "")
      setSelectedSubcategory("")
      setSelectedInvestment("")
      setSelectedLiability("")
      setSelectedPaymentMethod("")
      return
    }

    if (type === "inversion") {
      setSelectedCategory(investmentCategory?.id || "")
      setSelectedSubcategory("")
      setSelectedLiability("")
      return
    }

    if (type === "abono_deuda") {
      setSelectedCategory(debtCategory?.id || "")
      setSelectedSubcategory("")
      setSelectedInvestment("")
      return
    }

    if (type === "gasto") {
      const selected = categories.find(
        (category) => category.id === selectedCategory
      )

      const isValidExpenseCategory =
        selected &&
        EXPENSE_CATEGORY_NAMES.some(
          (name) =>
            normalizeName(name) ===
            normalizeName(selected.name)
        )

      if (!isValidExpenseCategory) {
        setSelectedCategory("")
        setSelectedSubcategory("")
      }

      setSelectedInvestment("")
      setSelectedLiability("")
    }
  }, [
    type,
    categories,
    incomeCategory?.id,
    investmentCategory?.id,
    debtCategory?.id,
  ])

  function getTypeLabel(value: string) {
    if (value === "ingreso") return "Ingreso"
    if (value === "gasto") return "Gasto"
    if (value === "inversion") return "Inversión"
    if (value === "abono_deuda") return "Abono deuda"
    return value
  }

  function getPaymentLabel(method: any) {
    if (!method) return ""

    if (method.type === "efectivo") {
      return "Efectivo"
    }

    const label = `${method.bank || ""} ${
      method.brand || ""
    } ${
      method.type === "debito" ? "Débito" : "Crédito"
    }`

    return label.replace(/\s+/g, " ").trim()
  }

  function formatMoney(
    value: number | string,
    movementCurrency: string
  ) {
    const numericValue = Number(value || 0)

    return `${movementCurrency}${numericValue.toLocaleString(
      "es-CR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`
  }

  async function updateCreditCardBalance(
    paymentMethodId: string,
    delta: number
  ) {
    if (!paymentMethodId || delta === 0) return true

    const user = await getUser()
    if (!user) return false

    const { data: method, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error(error)
      return false
    }

    if (!method || method.type !== "credito") {
      return true
    }

    const newBalance = Math.max(
      Number(method.current_balance || 0) + delta,
      0
    )

    const { error: updateError } = await supabase
      .from("payment_methods")
      .update({ current_balance: newBalance })
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error(updateError)
      return false
    }

    return true
  }

  async function updateInvestmentBalance(
    investmentId: string,
    delta: number
  ) {
    if (!investmentId || delta === 0) return true

    const user = await getUser()
    if (!user) return false

    const { data: investment, error } = await supabase
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .eq("user_id", user.id)
      .single()

    if (error || !investment) {
      console.error(error)
      return false
    }

    const newAmountInvested = Math.max(
      Number(investment.amount_invested || 0) + delta,
      0
    )

    const newCurrentValue = Math.max(
      Number(investment.current_value || 0) + delta,
      0
    )

    const { error: updateError } = await supabase
      .from("investments")
      .update({
        amount_invested: newAmountInvested,
        current_value: newCurrentValue,
      })
      .eq("id", investmentId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error(updateError)
      return false
    }

    return true
  }

  async function updateLiabilityBalance(
    liabilityId: string,
    delta: number
  ) {
    if (!liabilityId || delta === 0) return true

    const user = await getUser()
    if (!user) return false

    const { data: liability, error } = await supabase
      .from("liabilities")
      .select("*")
      .eq("id", liabilityId)
      .eq("user_id", user.id)
      .single()

    if (error || !liability) {
      console.error(error)
      return false
    }

    const newAmount = Math.max(
      Number(liability.amount || 0) + delta,
      0
    )

    const { error: updateError } = await supabase
      .from("liabilities")
      .update({ amount: newAmount })
      .eq("id", liabilityId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error(updateError)
      return false
    }

    return true
  }

  async function applyMovementEffects(
    movement: any,
    direction: 1 | -1
  ) {
    const value = Number(movement.amount || 0)

    if (
      movement.type === "gasto" &&
      movement.payment_method_id
    ) {
      const success = await updateCreditCardBalance(
        movement.payment_method_id,
        value * direction
      )

      if (!success) return false
    }

    if (
      movement.type === "inversion" &&
      movement.investment_id
    ) {
      const success = await updateInvestmentBalance(
        movement.investment_id,
        value * direction
      )

      if (!success) return false
    }

    if (
      movement.type === "abono_deuda" &&
      movement.liability_id
    ) {
      const success = await updateLiabilityBalance(
        movement.liability_id,
        -value * direction
      )

      if (!success) return false
    }

    return true
  }

  async function saveMovement() {
    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount <= 0 || !date) {
      alert("Completa un monto mayor que cero y una fecha.")
      return
    }

    if (!finalCurrency) {
      alert("Debes ingresar la moneda personalizada.")
      return
    }

    if (
      (type === "ingreso" || type === "gasto") &&
      (!selectedCategory || !selectedSubcategory)
    ) {
      alert("Completa partida y subpartida.")
      return
    }

    if (type === "inversion" && !selectedInvestment) {
      alert("Debes seleccionar una inversión.")
      return
    }

    if (
      type === "abono_deuda" &&
      !selectedLiability
    ) {
      alert("Debes seleccionar una deuda.")
      return
    }

    const selectedCategoryData = categories.find(
      (category) => category.id === selectedCategory
    )

    if (
      type === "ingreso" &&
      normalizeName(selectedCategoryData?.name) !==
        normalizeName("Ingreso")
    ) {
      alert(
        "Los ingresos solo pueden registrarse en la partida Ingreso."
      )
      return
    }

    if (
      type === "gasto" &&
      !EXPENSE_CATEGORY_NAMES.some(
        (name) =>
          normalizeName(name) ===
          normalizeName(selectedCategoryData?.name)
      )
    ) {
      alert(
        "Selecciona una de las partidas oficiales disponibles para gastos."
      )
      return
    }

    if (
      type === "inversion" &&
      normalizeName(selectedCategoryData?.name) !==
        normalizeName("Ahorro e Inversión")
    ) {
      alert(
        "La partida Ahorro e Inversión no está disponible. Revisa la sección Partidas."
      )
      return
    }

    if (
      type === "abono_deuda" &&
      normalizeName(selectedCategoryData?.name) !==
        normalizeName("Deuda")
    ) {
      alert(
        "La partida Deuda no está disponible. Revisa la sección Partidas."
      )
      return
    }

    const selectedInvestmentData = investments.find(
      (investment) => investment.id === selectedInvestment
    )

    if (
      type === "inversion" &&
      selectedInvestmentData?.currency &&
      selectedInvestmentData.currency !== finalCurrency
    ) {
      alert(
        `La inversión seleccionada está registrada en ${selectedInvestmentData.currency}. Usa la misma moneda.`
      )
      return
    }

    const selectedLiabilityData = liabilities.find(
      (liability) => liability.id === selectedLiability
    )

    if (
      type === "abono_deuda" &&
      selectedLiabilityData?.currency &&
      selectedLiabilityData.currency !== finalCurrency
    ) {
      alert(
        `La deuda seleccionada está registrada en ${selectedLiabilityData.currency}. Usa la misma moneda.`
      )
      return
    }

    if (
      type === "abono_deuda" &&
      numericAmount >
        Number(selectedLiabilityData?.amount || 0)
    ) {
      alert(
        "El abono no puede ser mayor que el saldo pendiente de la deuda."
      )
      return
    }

    const user = await getUser()
    if (!user) return

    const movementData = {
      user_id: user.id,
      type,
      currency: finalCurrency,
      amount: numericAmount,
      movement_date: date,
      category_id: selectedCategory || null,
      subcategory_id:
        type === "ingreso" || type === "gasto"
          ? selectedSubcategory
          : null,
      payment_method_id:
        type === "ingreso"
          ? null
          : selectedPaymentMethod || null,
      investment_id:
        type === "inversion" ? selectedInvestment : null,
      liability_id:
        type === "abono_deuda" ? selectedLiability : null,
      description: description.trim() || null,
    }

    setSaving(true)

    if (editingId) {
      const { data: oldMovement, error: oldError } =
        await supabase
          .from("movements")
          .select("*")
          .eq("id", editingId)
          .eq("user_id", user.id)
          .single()

      if (oldError) {
        setSaving(false)
        alert(oldError.message)
        return
      }

      const reverted = await applyMovementEffects(
        oldMovement,
        -1
      )

      if (!reverted) {
        setSaving(false)
        alert(
          "No se pudieron revertir los efectos del movimiento anterior."
        )
        return
      }

      const { error: updateError } = await supabase
        .from("movements")
        .update(movementData)
        .eq("id", editingId)
        .eq("user_id", user.id)

      if (updateError) {
        await applyMovementEffects(oldMovement, 1)
        setSaving(false)
        alert(updateError.message)
        return
      }

      const applied = await applyMovementEffects(
        movementData,
        1
      )

      if (!applied) {
        await supabase
          .from("movements")
          .update(oldMovement)
          .eq("id", editingId)
          .eq("user_id", user.id)

        await applyMovementEffects(oldMovement, 1)

        setSaving(false)
        alert(
          "No se pudieron aplicar los efectos financieros del nuevo movimiento."
        )
        return
      }
    } else {
      const { data: createdMovement, error: insertError } =
        await supabase
          .from("movements")
          .insert(movementData)
          .select()
          .single()

      if (insertError) {
        setSaving(false)
        alert(insertError.message)
        return
      }

      const applied = await applyMovementEffects(
        createdMovement,
        1
      )

      if (!applied) {
        await supabase
          .from("movements")
          .delete()
          .eq("id", createdMovement.id)
          .eq("user_id", user.id)

        setSaving(false)
        alert(
          "El movimiento no se guardó porque no fue posible actualizar sus efectos financieros."
        )
        return
      }
    }

    await Promise.all([
      fetchPaymentMethods(),
      fetchInvestments(),
      fetchLiabilities(),
      fetchMovements(),
    ])

    const wasEditing = Boolean(editingId)

    resetForm()
    setSaving(false)

    alert(
      wasEditing
        ? "Movimiento actualizado correctamente."
        : "Movimiento guardado correctamente."
    )
  }
    function editMovement(movement: any) {
    setEditingId(movement.id)

    const movementType: MovementType =
      movement.type === "ingreso"
        ? "ingreso"
        : movement.type === "inversion"
          ? "inversion"
          : movement.type === "abono_deuda"
            ? "abono_deuda"
            : "gasto"

    setType(movementType)
    setAmount(String(movement.amount))
    setDate(movement.movement_date)
    setDescription(movement.description || "")
    setSelectedPaymentMethod(movement.payment_method_id || "")
    setSelectedInvestment(movement.investment_id || "")
    setSelectedLiability(movement.liability_id || "")

    if (movementType === "ingreso") {
      setSelectedCategory(incomeCategory?.id || "")
      setSelectedSubcategory(movement.subcategory_id || "")
    } else if (movementType === "inversion") {
      setSelectedCategory(investmentCategory?.id || "")
      setSelectedSubcategory("")
    } else if (movementType === "abono_deuda") {
      setSelectedCategory(debtCategory?.id || "")
      setSelectedSubcategory("")
    } else {
      const existingCategory = categories.find(
        (category) => category.id === movement.category_id
      )

      const isOfficialExpenseCategory = EXPENSE_CATEGORY_NAMES.some(
        (name) =>
          normalizeName(name) === normalizeName(existingCategory?.name)
      )

      setSelectedCategory(
        isOfficialExpenseCategory ? movement.category_id || "" : ""
      )

      setSelectedSubcategory(
        isOfficialExpenseCategory ? movement.subcategory_id || "" : ""
      )

      if (!isOfficialExpenseCategory) {
        alert(
          "Este movimiento utiliza una partida anterior. Debes reclasificarlo antes de guardarlo."
        )
      }
    }

    const defaultCurrencies = ["₡", "$", "€"]

    if (defaultCurrencies.includes(movement.currency)) {
      setCurrency(movement.currency)
      setCustomCurrency("")
    } else {
      setCurrency("custom")
      setCustomCurrency(movement.currency)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function deleteMovement(id: string) {
    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar este movimiento?"
    )

    if (!confirmDelete) return

    const user = await getUser()
    if (!user) return

    const { data: oldMovement, error: oldError } = await supabase
      .from("movements")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (oldError) {
      alert(oldError.message)
      return
    }

    const reverted = await applyMovementEffects(oldMovement, -1)

    if (!reverted) {
      alert(
        "No se pudieron revertir los efectos financieros del movimiento."
      )
      return
    }

    const { error: deleteError } = await supabase
      .from("movements")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      await applyMovementEffects(oldMovement, 1)
      alert(deleteError.message)
      return
    }

    await Promise.all([
      fetchPaymentMethods(),
      fetchInvestments(),
      fetchLiabilities(),
      fetchMovements(),
    ])
  }

  function resetForm() {
    setEditingId("")
    setAmount("")
    setDescription("")
    setDate(today)
    setType("gasto")
    setCurrency("₡")
    setCustomCurrency("")
    setSelectedCategory("")
    setSelectedSubcategory("")
    setSelectedPaymentMethod("")
    setSelectedInvestment("")
    setSelectedLiability("")
  }

  function clearFilters() {
    setShowHistorical(false)
    setFilterMonth(currentDate.getMonth() + 1)
    setFilterYear(currentDate.getFullYear())
    setFilterType("todos")
    setFilterCurrency("todas")
    setFilterCategory("")
    setFilterSubcategory("")
    setFilterPaymentMethod("")
  }

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
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"

  const labelClass = "mb-2 block text-sm text-textSecondary"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Registrar <span className="text-primary">Movimiento</span>
          </h1>

          <p className="mt-1 text-sm text-textSecondary">
            Registra ingresos, gastos, inversiones y abonos utilizando la
            metodología de Smart Capital.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <section className="w-full rounded-3xl border border-primary/20 bg-card p-4 lg:max-w-4xl lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingId ? "Editar movimiento" : "Nuevo movimiento"}
                </h2>

                <p className="mt-1 text-sm text-textSecondary">
                  La partida se asignará según el tipo de movimiento.
                </p>
              </div>

              {editingId && (
                <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
                  Modo edición
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Tipo de movimiento</label>

                <select
                  value={type}
                  onChange={(event) => {
                    const newType = event.target.value as MovementType

                    setType(newType)
                    setSelectedCategory("")
                    setSelectedSubcategory("")
                    setSelectedInvestment("")
                    setSelectedLiability("")

                    if (newType === "ingreso") {
                      setSelectedPaymentMethod("")
                    }
                  }}
                  className={inputClass}
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="inversion">Inversión</option>
                  <option value="abono_deuda">Abono deuda</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Moneda</label>

                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className={inputClass}
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                  <option value="custom">Otra</option>
                </select>
              </div>

              {currency === "custom" && (
                <div>
                  <label className={labelClass}>
                    Moneda personalizada
                  </label>

                  <input
                    value={customCurrency}
                    onChange={(event) =>
                      setCustomCurrency(event.target.value.toUpperCase())
                    }
                    placeholder="Ej: COP, MXN"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Monto</label>

                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Ej: 25000"
                  min="0"
                  step="0.01"
                  type="number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Fecha</label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    type="date"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    className="rounded-xl border border-primary/40 px-4 py-3 text-sm font-bold text-primary"
                  >
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={() => setDate(yesterday)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-textSecondary"
                  >
                    Ayer
                  </button>
                </div>
              </div>

              {(type === "gasto" || type === "ingreso") && (
                <>
                  <div>
                    <label className={labelClass}>Partida</label>

                    <select
                      value={selectedCategory}
                      onChange={(event) => {
                        setSelectedCategory(event.target.value)
                        setSelectedSubcategory("")
                      }}
                      disabled={type === "ingreso"}
                      className={inputClass}
                    >
                      <option value="">Selecciona una partida</option>

                      {visibleCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs text-textSecondary">
                      {type === "ingreso"
                        ? "Ingreso se asigna automáticamente."
                        : "Selecciona el propósito financiero principal del gasto."}
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Subpartida</label>

                    <select
                      value={selectedSubcategory}
                      onChange={(event) =>
                        setSelectedSubcategory(event.target.value)
                      }
                      className={inputClass}
                      disabled={!selectedCategory}
                    >
                      <option value="">Selecciona una subpartida</option>

                      {formSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>

                    {selectedCategory &&
                      formSubcategories.length === 0 && (
                        <p className="mt-2 text-xs text-amber-300">
                          Esta partida todavía no tiene subpartidas. Créala
                          primero desde Partidas.
                        </p>
                      )}
                  </div>
                </>
              )}

              {type === "inversion" && (
                <>
                  <div>
                    <label className={labelClass}>
                      Partida automática
                    </label>

                    <input
                      value="Ahorro e Inversión"
                      disabled
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Inversión</label>

                    <select
                      value={selectedInvestment}
                      onChange={(event) =>
                        setSelectedInvestment(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Selecciona una inversión</option>

                      {investments.map((investment) => (
                        <option key={investment.id} value={investment.id}>
                          {investment.name}
                          {investment.currency
                            ? ` · ${investment.currency}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {type === "abono_deuda" && (
                <>
                  <div>
                    <label className={labelClass}>
                      Partida automática
                    </label>

                    <input value="Deuda" disabled className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Deuda</label>

                    <select
                      value={selectedLiability}
                      onChange={(event) =>
                        setSelectedLiability(event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Selecciona una deuda</option>

                      {liabilities.map((liability) => (
                        <option key={liability.id} value={liability.id}>
                          {liability.name} ·{" "}
                          {formatMoney(
                            liability.amount,
                            liability.currency
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(type === "gasto" ||
                type === "inversion" ||
                type === "abono_deuda") && (
                <div>
                  <label className={labelClass}>Medio de pago</label>

                  <select
                    value={selectedPaymentMethod}
                    onChange={(event) =>
                      setSelectedPaymentMethod(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Sin medio de pago</option>

                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {getPaymentLabel(method)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className={labelClass}>Comentario opcional</label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ej: compra semanal, pago recibido, inversión o abono..."
                className="min-h-28 w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"
              />
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={saveMovement}
                disabled={saving}
                className="rounded-full bg-primary px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar movimiento"
                    : "Guardar movimiento"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-full border border-white/10 px-6 py-3 font-bold text-white"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-card p-4 lg:p-6">
            <h2 className="text-xl font-bold">Filtros</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!showHistorical && (
                <>
                  <select
                    value={filterMonth}
                    onChange={(event) =>
                      setFilterMonth(Number(event.target.value))
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
                    value={filterYear}
                    onChange={(event) =>
                      setFilterYear(Number(event.target.value))
                    }
                    type="number"
                    className={inputClass}
                  />
                </>
              )}

              <select
                value={filterType}
                onChange={(event) => {
                  setFilterType(event.target.value)
                  setFilterCategory("")
                  setFilterSubcategory("")
                }}
                className={inputClass}
              >
                <option value="todos">Todos los tipos</option>
                <option value="gasto">Gastos</option>
                <option value="ingreso">Ingresos</option>
                <option value="inversion">Inversiones</option>
                <option value="abono_deuda">Abonos deuda</option>
              </select>

              <select
                value={filterCurrency}
                onChange={(event) =>
                  setFilterCurrency(event.target.value)
                }
                className={inputClass}
              >
                <option value="todas">Todas las monedas</option>
                <option value="₡">Colones ₡</option>
                <option value="$">Dólares $</option>
                <option value="€">Euros €</option>
              </select>

              <select
                value={filterCategory}
                onChange={(event) => {
                  setFilterCategory(event.target.value)
                  setFilterSubcategory("")
                }}
                className={inputClass}
              >
                <option value="">Todas las partidas</option>

                {filterCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!masterCategories.some(
                      (masterCategory) =>
                        masterCategory.id === category.id
                    )
                      ? " · anterior"
                      : ""}
                  </option>
                ))}
              </select>

              {filterCategory && (
                <select
                  value={filterSubcategory}
                  onChange={(event) =>
                    setFilterSubcategory(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Todas las subpartidas</option>

                  {filterSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterPaymentMethod}
                onChange={(event) =>
                  setFilterPaymentMethod(event.target.value)
                }
                className={inputClass}
              >
                <option value="">Todos los medios de pago</option>

                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {getPaymentLabel(method)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setShowHistorical(!showHistorical)}
                className={`rounded-full px-6 py-3 font-bold ${
                  showHistorical
                    ? "bg-primary text-white"
                    : "border border-primary/40 text-primary"
                }`}
              >
                {showHistorical
                  ? "Volver a mes/año"
                  : "Histórico total"}
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-white/10 px-6 py-3 font-bold text-white"
              >
                Limpiar filtros
              </button>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-card p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Movimientos guardados
                </h2>

                <p className="mt-1 text-sm text-textSecondary">
                  {movements.length} movimientos encontrados
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {movements.length === 0 ? (
                <p className="text-textSecondary">
                  No hay movimientos para los filtros seleccionados.
                </p>
              ) : (
                movements.map((movement) => (
                  <article
                    key={movement.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-input p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-bold">
                        {getTypeLabel(movement.type)}

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
                          Inversión: {movement.investments.name}
                        </p>
                      )}

                      {movement.liabilities && (
                        <p className="mt-1 break-words text-sm text-red-400">
                          Deuda: {movement.liabilities.name}
                        </p>
                      )}

                      {movement.payment_methods && (
                        <p className="mt-1 break-words text-sm text-primary">
                          Medio de pago:{" "}
                          {getPaymentLabel(movement.payment_methods)}
                        </p>
                      )}

                      {movement.description && (
                        <p className="mt-1 break-words text-sm text-textSecondary">
                          {movement.description}
                        </p>
                      )}

                      {movement.categories?.name &&
                        !MASTER_CATEGORY_NAMES.some(
                          (name) =>
                            normalizeName(name) ===
                            normalizeName(movement.categories.name)
                        ) && (
                          <p className="mt-2 text-xs font-bold text-amber-300">
                            Partida anterior pendiente de reclasificación
                          </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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
                          movement.amount,
                          movement.currency
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() => editMovement(movement)}
                        className="rounded-full border border-primary/40 px-4 py-2 text-sm font-bold text-primary"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMovement(movement.id)}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Movements