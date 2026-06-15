 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

type MovementType = "gasto" | "ingreso" | "inversion" | "abono_deuda"

function Movements() {
  const today = new Date().toLocaleDateString("en-CA")

  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toLocaleDateString("en-CA")

  const currentDate = new Date()

  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear())
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [liabilities, setLiabilities] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])

  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [selectedInvestment, setSelectedInvestment] = useState("")
  const [selectedLiability, setSelectedLiability] = useState("")

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
    fetchPaymentMethods()
    fetchInvestments()
    fetchLiabilities()
  }, [])

  useEffect(() => {
    fetchMovements()
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

  useEffect(() => {
    if (type === "ingreso") {
      const incomeCategory = categories.find(
        (category) => category.name.toLowerCase() === "ingreso"
      )

      if (incomeCategory) {
        setSelectedCategory(incomeCategory.id)
        setSelectedSubcategory("")
      }
    }

    if (type === "gasto") {
      const selected = categories.find(
        (category) => category.id === selectedCategory
      )

      if (selected?.name?.toLowerCase() === "ingreso") {
        setSelectedCategory("")
        setSelectedSubcategory("")
      }
    }

    if (type === "inversion" || type === "abono_deuda") {
      setSelectedCategory("")
      setSelectedSubcategory("")
    }
  }, [type, categories])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function fetchCategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

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

    if (!showHistorical) {
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

      query = query.gte("movement_date", startDate).lt("movement_date", endDate)
    }

    if (filterType !== "todos") query = query.eq("type", filterType)
    if (filterCurrency !== "todas") query = query.eq("currency", filterCurrency)
    if (filterCategory) query = query.eq("category_id", filterCategory)
    if (filterSubcategory) query = query.eq("subcategory_id", filterSubcategory)
    if (filterPaymentMethod) query = query.eq("payment_method_id", filterPaymentMethod)

    const { data, error } = await query

    if (error) {
      alert(error.message)
      return
    }

    setMovements(data || [])
  }

  const incomeCategory = categories.find(
    (category) => category.name.toLowerCase() === "ingreso"
  )

  const expenseCategories = categories.filter(
    (category) => category.name.toLowerCase() !== "ingreso"
  )

  const visibleCategories =
    type === "ingreso"
      ? incomeCategory
        ? [incomeCategory]
        : []
      : expenseCategories

  const filterCategories =
    filterType === "ingreso"
      ? incomeCategory
        ? [incomeCategory]
        : []
      : filterType === "gasto"
      ? expenseCategories
      : categories

  const formSubcategories = subcategories.filter(
    (sub) => sub.category_id === selectedCategory
  )

  const filterSubcategories = subcategories.filter(
    (sub) => sub.category_id === filterCategory
  )

  const finalCurrency = currency === "custom" ? customCurrency.trim() : currency

  function getTypeLabel(value: string) {
    if (value === "ingreso") return "Ingreso"
    if (value === "gasto") return "Gasto"
    if (value === "inversion") return "Inversión"
    if (value === "abono_deuda") return "Abono deuda"
    return value
  }

  function getPaymentLabel(method: any) {
    if (!method) return ""

    if (method.type === "efectivo") return "Efectivo"

    return `${method.bank || ""} ${method.brand || ""} ${
      method.type === "debito" ? "Débito" : "Crédito"
    }`
  }

  async function updateCreditCardBalance(paymentMethodId: string, delta: number) {
    if (!paymentMethodId || delta === 0) return

    const user = await getUser()
    if (!user) return

    const { data: method, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .single()

    if (error || !method || method.type !== "credito") return

    const newBalance = Math.max(Number(method.current_balance || 0) + delta, 0)

    await supabase
      .from("payment_methods")
      .update({ current_balance: newBalance })
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
  }

  async function updateInvestmentBalance(investmentId: string, delta: number) {
    if (!investmentId || delta === 0) return

    const user = await getUser()
    if (!user) return

    const { data: investment, error } = await supabase
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .eq("user_id", user.id)
      .single()

    if (error || !investment) return

    const newAmountInvested = Math.max(
      Number(investment.amount_invested || 0) + delta,
      0
    )

    const newCurrentValue = Math.max(
      Number(investment.current_value || 0) + delta,
      0
    )

    await supabase
      .from("investments")
      .update({
        amount_invested: newAmountInvested,
        current_value: newCurrentValue,
      })
      .eq("id", investmentId)
      .eq("user_id", user.id)
  }

  async function updateLiabilityBalance(liabilityId: string, delta: number) {
    if (!liabilityId || delta === 0) return

    const user = await getUser()
    if (!user) return

    const { data: liability, error } = await supabase
      .from("liabilities")
      .select("*")
      .eq("id", liabilityId)
      .eq("user_id", user.id)
      .single()

    if (error || !liability) return

    const newAmount = Math.max(Number(liability.amount || 0) + delta, 0)

    await supabase
      .from("liabilities")
      .update({ amount: newAmount })
      .eq("id", liabilityId)
      .eq("user_id", user.id)
  }

  async function applyMovementEffects(movement: any, direction: 1 | -1) {
    const value = Number(movement.amount || 0)

    if (movement.type === "gasto" && movement.payment_method_id) {
      await updateCreditCardBalance(
        movement.payment_method_id,
        value * direction
      )
    }

    if (movement.type === "inversion" && movement.investment_id) {
      await updateInvestmentBalance(movement.investment_id, value * direction)
    }
if (movement.type === "abono_deuda" && movement.liability_id) {
  await updateLiabilityBalance(movement.liability_id, -value * direction)
}
  }

  async function saveMovement() {
    if (!amount || !date) {
      alert("Completa monto y fecha.")
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

    if (type === "abono_deuda" && !selectedLiability) {
      alert("Debes seleccionar una deuda.")
      return
    }

    const selectedCategoryData = categories.find(
      (category) => category.id === selectedCategory
    )

    if (
      type === "ingreso" &&
      selectedCategoryData?.name?.toLowerCase() !== "ingreso"
    ) {
      alert("Los ingresos solo pueden registrarse en la partida Ingreso.")
      return
    }

    if (
      type === "gasto" &&
      selectedCategoryData?.name?.toLowerCase() === "ingreso"
    ) {
      alert("Los gastos no pueden registrarse en la partida Ingreso.")
      return
    }

    const user = await getUser()
    if (!user) return

    const movementData = {
      user_id: user.id,
      type,
      currency: finalCurrency,
      amount: Number(amount),
      movement_date: date,
      category_id:
        type === "ingreso" || type === "gasto" ? selectedCategory : null,
      subcategory_id:
        type === "ingreso" || type === "gasto" ? selectedSubcategory : null,
      payment_method_id: selectedPaymentMethod || null,
      investment_id: type === "inversion" ? selectedInvestment : null,
      liability_id: type === "abono_deuda" ? selectedLiability : null,
      description: description || null,
    }

    if (editingId) {
      const { data: oldMovement, error: oldError } = await supabase
        .from("movements")
        .select("*")
        .eq("id", editingId)
        .eq("user_id", user.id)
        .single()

      if (oldError) {
        alert(oldError.message)
        return
      }

      await applyMovementEffects(oldMovement, -1)

      const { error } = await supabase
        .from("movements")
        .update(movementData)
        .eq("id", editingId)
        .eq("user_id", user.id)

      if (error) {
        await applyMovementEffects(oldMovement, 1)
        alert(error.message)
        return
      }

      await applyMovementEffects(movementData, 1)
    } else {
      const { error } = await supabase.from("movements").insert(movementData)

      if (error) {
        alert(error.message)
        return
      }

      await applyMovementEffects(movementData, 1)
    }

    await fetchPaymentMethods()
    await fetchInvestments()
    await fetchLiabilities()
    await fetchMovements()
    resetForm()

    alert(
      editingId
        ? "Movimiento actualizado correctamente."
        : "Movimiento guardado correctamente."
    )
  }

  function editMovement(movement: any) {
    setEditingId(movement.id)

    setType(
      movement.type === "ingreso"
        ? "ingreso"
        : movement.type === "inversion"
        ? "inversion"
        : movement.type === "abono_deuda"
        ? "abono_deuda"
        : "gasto"
    )

    setAmount(String(movement.amount))
    setDate(movement.movement_date)
    setDescription(movement.description || "")
    setSelectedCategory(movement.category_id || "")
    setSelectedSubcategory(movement.subcategory_id || "")
    setSelectedPaymentMethod(movement.payment_method_id || "")
    setSelectedInvestment(movement.investment_id || "")
    setSelectedLiability(movement.liability_id || "")

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
    const confirmDelete = confirm("¿Seguro que quieres eliminar este movimiento?")
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

    await applyMovementEffects(oldMovement, -1)

    const { error } = await supabase
      .from("movements")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      await applyMovementEffects(oldMovement, 1)
      alert(error.message)
      return
    }

    await fetchPaymentMethods()
    await fetchInvestments()
    await fetchLiabilities()
    fetchMovements()
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
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  const labelClass = "mb-2 block text-sm text-textSecondary"
    return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Registrar <span className="text-primary">Movimiento</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Registra ingresos, gastos, inversiones, abonos de deuda y medios de pago.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="w-full rounded-3xl border border-primary/20 bg-card p-4 lg:max-w-4xl lg:p-6">
            <h2 className="text-xl font-bold">
              {editingId ? "Editar movimiento" : "Nuevo movimiento"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Tipo de movimiento</label>

                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as MovementType
                    setType(newType)
                    setSelectedCategory("")
                    setSelectedSubcategory("")
                    setSelectedInvestment("")
                    setSelectedLiability("")
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
                  onChange={(e) => setCurrency(e.target.value)}
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
                  <label className={labelClass}>Moneda personalizada</label>

                  <input
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value)}
                    placeholder="Ej: COP, MXN"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Monto</label>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 25000"
                  type="number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Fecha</label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                      onChange={(e) => {
                        setSelectedCategory(e.target.value)
                        setSelectedSubcategory("")
                      }}
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
                        ? "Para ingresos solo se usa la partida fija Ingreso."
                        : "Para gastos se oculta la partida Ingreso."}
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Subpartida</label>

                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
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
                  </div>
                </>
              )}

              {type === "inversion" && (
                <div>
                  <label className={labelClass}>Inversión</label>

                  <select
                    value={selectedInvestment}
                    onChange={(e) => setSelectedInvestment(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecciona una inversión</option>

                    {investments.map((investment) => (
                      <option key={investment.id} value={investment.id}>
                        {investment.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === "abono_deuda" && (
                <div>
                  <label className={labelClass}>Deuda</label>

                  <select
                    value={selectedLiability}
                    onChange={(e) => setSelectedLiability(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecciona una deuda</option>

                    {liabilities.map((liability) => (
                      <option key={liability.id} value={liability.id}>
                        {liability.name} ({liability.currency}
                        {liability.amount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(type === "gasto" ||
                type === "inversion" ||
                type === "abono_deuda") && (
                <div>
                  <label className={labelClass}>Medio de pago</label>

                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sin medio de pago</option>

                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.type === "efectivo"
                          ? "Efectivo"
                          : `${method.bank || ""} ${method.brand || ""} ${
                              method.type === "debito" ? "Débito" : "Crédito"
                            }`}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: compra, pago recibido, inversión o abono de deuda..."
                className="min-h-28 w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"
              />
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                onClick={saveMovement}
                className="rounded-full bg-primary px-6 py-3 font-bold text-white"
              >
                {editingId ? "Actualizar movimiento" : "Guardar movimiento"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-full border border-white/10 px-6 py-3 font-bold text-white"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-4 lg:p-6">
            <h2 className="text-xl font-bold">Filtros</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!showHistorical && (
                <>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
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
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    type="number"
                    className={inputClass}
                  />
                </>
              )}

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
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
                onChange={(e) => setFilterCurrency(e.target.value)}
                className={inputClass}
              >
                <option value="todas">Todas las monedas</option>
                <option value="₡">Colones ₡</option>
                <option value="$">Dólares $</option>
                <option value="€">Euros €</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setFilterSubcategory("")
                }}
                className={inputClass}
              >
                <option value="">Todas las partidas</option>

                {filterCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {filterCategory && (
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
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
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos los medios de pago</option>

                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.type === "efectivo"
                      ? "Efectivo"
                      : `${method.bank || ""} ${method.brand || ""} ${
                          method.type === "debito" ? "Débito" : "Crédito"
                        }`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => setShowHistorical(!showHistorical)}
                className={`rounded-full px-6 py-3 font-bold ${
                  showHistorical
                    ? "bg-primary text-white"
                    : "border border-primary/40 text-primary"
                }`}
              >
                {showHistorical ? "Volver a mes/año" : "Histórico total"}
              </button>

              <button
                onClick={clearFilters}
                className="rounded-full border border-white/10 px-6 py-3 font-bold text-white"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-4 lg:p-6">
            <h2 className="text-xl font-bold">Movimientos guardados</h2>

            <div className="mt-6 space-y-4">
              {movements.length === 0 ? (
                <p className="text-textSecondary">
                  No hay movimientos para los filtros seleccionados.
                </p>
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-input p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5"
                  >
                    <div>
                      <p className="font-bold">
                        {getTypeLabel(movement.type)}
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
                          {getPaymentLabel(movement.payment_methods)}
                        </p>
                      )}

                      {movement.description && (
                        <p className="mt-1 text-sm text-textSecondary">
                          {movement.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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

                      <button
                        onClick={() => editMovement(movement)}
                        className="rounded-full border border-primary/40 px-4 py-2 text-sm font-bold text-primary"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => deleteMovement(movement.id)}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
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

export default Movements

               