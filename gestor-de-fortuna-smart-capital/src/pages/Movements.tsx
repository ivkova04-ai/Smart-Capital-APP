 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

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

  const [editingId, setEditingId] = useState("")
  const [type, setType] = useState("gasto")
  const [currency, setCurrency] = useState("₡")
  const [customCurrency, setCustomCurrency] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState("")

  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])

  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
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
  ])

  async function fetchCategories() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

  async function fetchMovements() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

      query = query.gte("movement_date", startDate).lt("movement_date", endDate)
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

    const { data, error } = await query

    if (error) {
      alert(error.message)
      return
    }

    setMovements(data || [])
  }

  const formSubcategories = subcategories.filter(
    (sub) => sub.category_id === selectedCategory
  )

  const filterSubcategories = subcategories.filter(
    (sub) => sub.category_id === filterCategory
  )

  const finalCurrency = currency === "custom" ? customCurrency : currency

  async function saveMovement() {
    if (!amount || !selectedCategory || !selectedSubcategory || !date) {
      alert("Completa monto, fecha, partida y subpartida.")
      return
    }

    if (!finalCurrency) {
      alert("Debes ingresar la moneda personalizada.")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const movementData = {
      user_id: user.id,
      type,
      currency: finalCurrency,
      amount: Number(amount),
      movement_date: date,
      category_id: selectedCategory,
      subcategory_id: selectedSubcategory,
      description: description || null,
    }

    const { error } = editingId
      ? await supabase.from("movements").update(movementData).eq("id", editingId)
      : await supabase.from("movements").insert(movementData)

    if (error) {
      alert(error.message)
      return
    }

    resetForm()
    fetchMovements()

    alert(
      editingId
        ? "Movimiento actualizado correctamente."
        : "Movimiento guardado correctamente."
    )
  }

  function editMovement(movement: any) {
    setEditingId(movement.id)
    setType(movement.type)
    setAmount(String(movement.amount))
    setDate(movement.movement_date)
    setDescription(movement.description || "")
    setSelectedCategory(movement.category_id)
    setSelectedSubcategory(movement.subcategory_id)

    const defaultCurrencies = ["₡", "$", "€", "₿"]

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

    const { error } = await supabase.from("movements").delete().eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

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
  }

  function clearFilters() {
    setShowHistorical(false)
    setFilterMonth(currentDate.getMonth() + 1)
    setFilterYear(currentDate.getFullYear())
    setFilterType("todos")
    setFilterCurrency("todas")
    setFilterCategory("")
    setFilterSubcategory("")
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

  return (
    <div className="min-h-screen bg-[#121212] text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Registrar <span className="text-[#E0B04B]">Movimiento</span>
          </h1>

          <p className="text-sm text-gray-400">
            Agrega, filtra, edita y elimina ingresos o gastos.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="w-full rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-4 lg:max-w-4xl lg:p-6">
            <h2 className="text-xl font-bold">
              {editingId ? "Editar movimiento" : "Nuevo movimiento"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Tipo de movimiento
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Moneda
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="₡">Colones ₡</option>
                  <option value="$">Dólares $</option>
                  <option value="€">Euros €</option>
                  <option value="₿">Bitcoin ₿</option>
                  <option value="custom">Otra</option>
                </select>
              </div>

              {currency === "custom" && (
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Moneda personalizada
                  </label>

                  <input
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value)}
                    placeholder="Ej: ETH, USDT, COP"
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Monto
                </label>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 25000"
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Fecha
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    className="rounded-xl border border-[#E0B04B]/40 px-4 py-3 text-sm font-bold text-[#E0B04B]"
                  >
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={() => setDate(yesterday)}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-300"
                  >
                    Ayer
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Partida
                </label>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setSelectedSubcategory("")
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="">Selecciona una partida</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Subpartida
                </label>

                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
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
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-400">
                Comentario opcional
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Compra en supermercado, cena familiar, pago recibido..."
                className="min-h-28 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              />
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                onClick={saveMovement}
                className="rounded-full bg-[#E0B04B] px-6 py-3 font-bold text-black"
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

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#1a1a1a] p-4 lg:p-6">
            <h2 className="text-xl font-bold">Filtros</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!showHistorical && (
                <>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
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
                    className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                  />
                </>
              )}

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              >
                <option value="todos">Todos los tipos</option>
                <option value="gasto">Gastos</option>
                <option value="ingreso">Ingresos</option>
              </select>

              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              >
                <option value="todas">Todas las monedas</option>
                <option value="₡">Colones ₡</option>
                <option value="$">Dólares $</option>
                <option value="€">Euros €</option>
                <option value="₿">Bitcoin ₿</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setFilterSubcategory("")
                }}
                className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              >
                <option value="">Todas las partidas</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {filterCategory && (
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
                >
                  <option value="">Todas las subpartidas</option>

                  {filterSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => setShowHistorical(!showHistorical)}
                className={`rounded-full px-6 py-3 font-bold ${
                  showHistorical
                    ? "bg-[#E0B04B] text-black"
                    : "border border-[#E0B04B]/40 text-[#E0B04B]"
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

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#1a1a1a] p-4 lg:p-6">
            <h2 className="text-xl font-bold">Movimientos guardados</h2>

            <div className="mt-6 space-y-4">
              {movements.length === 0 ? (
                <p className="text-gray-400">
                  No hay movimientos para los filtros seleccionados.
                </p>
              ) : (
                movements.map((movement) => (
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

                    <div className="flex flex-wrap items-center gap-3">
                      <p
                        className={`text-xl font-bold ${
                          movement.type === "ingreso"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {movement.currency}
                        {movement.amount}
                      </p>

                      <button
                        onClick={() => editMovement(movement)}
                        className="rounded-full border border-[#E0B04B]/40 px-4 py-2 text-sm font-bold text-[#E0B04B]"
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