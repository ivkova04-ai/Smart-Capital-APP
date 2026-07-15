 import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

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

type PaymentMethod = {
  id: string
  user_id: string
  name: string
  type: "efectivo" | "debito" | "credito"
  brand?: string | null
  bank?: string | null
  credit_limit?: number | null
  current_balance?: number | null
  created_at?: string
}

const MASTER_CATEGORIES = [
  {
    key: "income",
    name: "Ingreso",
    description: "Partida exclusiva para registrar ingresos.",
    color: "secondary",
  },
  {
    key: "survival",
    name: "Supervivencia",
    description: "Necesidades esenciales para vivir y mantener estabilidad.",
    color: "primary",
  },
  {
    key: "education",
    name: "Educación",
    description: "Formación, aprendizaje y crecimiento profesional.",
    color: "primary",
  },
  {
    key: "luxury",
    name: "Lujos",
    description: "Consumos opcionales orientados al disfrute personal.",
    color: "primary",
  },
  {
    key: "ant_expenses",
    name: "Gastos Hormiga",
    description: "Pequeños gastos frecuentes que reducen tu liquidez.",
    color: "primary",
  },
  {
    key: "donations",
    name: "Donativos",
    description: "Aportes, regalos y contribuciones voluntarias.",
    color: "primary",
  },
  {
    key: "debt",
    name: "Deuda",
    description: "Pagos y abonos destinados a reducir pasivos.",
    color: "primary",
  },
  {
    key: "savings_investment",
    name: "Ahorro e Inversión",
    description:
      "Dinero destinado a ahorro, inversión y construcción patrimonial.",
    color: "primary",
  },
] as const

const INCOME_SUBCATEGORIES = [
  "Salario",
  "Servicios profesionales",
  "Regalías",
  "Comisión",
]

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("es")
}

function Categories() {
  const [subcategoryName, setSubcategoryName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [savingSubcategory, setSavingSubcategory] = useState(false)

  const [paymentName, setPaymentName] = useState("")
  const [paymentType, setPaymentType] = useState<
    "efectivo" | "debito" | "credito"
  >("efectivo")
  const [paymentBrand, setPaymentBrand] = useState("")
  const [paymentBank, setPaymentBank] = useState("")
  const [paymentCreditLimit, setPaymentCreditLimit] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  useEffect(() => {
    void initializePage()
  }, [])

  async function initializePage() {
    setLoadingCategories(true)

    await ensureMasterCategories()

    await Promise.all([
      fetchCategories(),
      fetchSubcategories(),
      fetchPaymentMethods(),
    ])

    setLoadingCategories(false)
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

  async function ensureMasterCategories() {
    const user = await getUser()
    if (!user) return

    const { data: existingCategories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)

    if (categoriesError) {
      alert(categoriesError.message)
      return
    }

    const availableCategories = [...(existingCategories || [])]

    for (const masterCategory of MASTER_CATEGORIES) {
      let category = availableCategories.find(
        (item) => normalizeName(item.name) === normalizeName(masterCategory.name)
      )

      if (!category) {
        const { data: createdCategory, error: createError } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: masterCategory.name,
          })
          .select()
          .single()

        if (createError) {
          alert(
            `No se pudo crear la partida ${masterCategory.name}: ${createError.message}`
          )
          return
        }

        category = createdCategory
        availableCategories.push(createdCategory)
      }
    }

    const incomeCategory = availableCategories.find(
      (item) => normalizeName(item.name) === normalizeName("Ingreso")
    )

    if (!incomeCategory) return

    const { data: existingIncomeSubcategories, error: subcategoriesError } =
      await supabase
        .from("subcategories")
        .select("*")
        .eq("user_id", user.id)
        .eq("category_id", incomeCategory.id)

    if (subcategoriesError) {
      alert(subcategoriesError.message)
      return
    }

    for (const subcategoryName of INCOME_SUBCATEGORIES) {
      const alreadyExists = existingIncomeSubcategories?.some(
        (subcategory) =>
          normalizeName(subcategory.name) === normalizeName(subcategoryName)
      )

      if (!alreadyExists) {
        const { error: createSubcategoryError } = await supabase
          .from("subcategories")
          .insert({
            user_id: user.id,
            category_id: incomeCategory.id,
            name: subcategoryName,
          })

        if (createSubcategoryError) {
          alert(
            `No se pudo crear la subpartida ${subcategoryName}: ${createSubcategoryError.message}`
          )
          return
        }
      }
    }
  }

  async function fetchCategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      console.error(error)
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
      console.error(error)
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
      console.error(error)
      return
    }

    setPaymentMethods(data || [])
  }

  async function addSubcategory() {
    const cleanName = subcategoryName.trim()

    if (!selectedCategory) {
      alert("Selecciona una partida.")
      return
    }

    if (!cleanName) {
      alert("Escribe el nombre de la subpartida.")
      return
    }

    const selectedMasterCategory = categories.find(
      (category) => category.id === selectedCategory
    )

    if (!selectedMasterCategory) {
      alert("La partida seleccionada no existe.")
      return
    }

    const isMasterCategory = MASTER_CATEGORIES.some(
      (masterCategory) =>
        normalizeName(masterCategory.name) ===
        normalizeName(selectedMasterCategory.name)
    )

    if (!isMasterCategory) {
      alert(
        "Solo puedes agregar subpartidas dentro de las partidas oficiales de Smart Capital."
      )
      return
    }

    const duplicate = subcategories.some(
      (subcategory) =>
        subcategory.category_id === selectedCategory &&
        normalizeName(subcategory.name) === normalizeName(cleanName)
    )

    if (duplicate) {
      alert("Ya existe una subpartida con ese nombre dentro de esta partida.")
      return
    }

    const user = await getUser()
    if (!user) return

    setSavingSubcategory(true)

    const { error } = await supabase.from("subcategories").insert({
      user_id: user.id,
      category_id: selectedCategory,
      name: cleanName,
    })

    setSavingSubcategory(false)

    if (error) {
      alert(error.message)
      return
    }

    setSubcategoryName("")
    await fetchSubcategories()
  }

  async function deleteSubcategory(subcategoryId: string) {
    const { data: relatedMovements, error: checkError } = await supabase
      .from("movements")
      .select("id")
      .eq("subcategory_id", subcategoryId)
      .limit(1)

    if (checkError) {
      alert(checkError.message)
      return
    }

    if (relatedMovements && relatedMovements.length > 0) {
      alert(
        "No puedes eliminar esta subpartida porque ya tiene movimientos asociados. Primero edita o elimina esos movimientos."
      )
      return
    }

    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar esta subpartida?"
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", subcategoryId)

    if (error) {
      alert(error.message)
      return
    }

    await fetchSubcategories()
  }

  async function addPaymentMethod() {
    const user = await getUser()
    if (!user) return

    if (paymentType !== "efectivo" && !paymentBank.trim()) {
      alert("Debes indicar el banco.")
      return
    }

    if (paymentType === "credito" && !paymentCreditLimit) {
      alert("Debes indicar el límite de crédito.")
      return
    }

    const creditLimit = Number(paymentCreditLimit || 0)

    if (paymentType === "credito" && creditLimit <= 0) {
      alert("El límite de crédito debe ser mayor que cero.")
      return
    }

    const finalName =
      paymentType === "efectivo"
        ? "Efectivo"
        : paymentName.trim() ||
          `${paymentBank.trim()} ${paymentBrand}`.trim()

    const { error } = await supabase.from("payment_methods").insert({
      user_id: user.id,
      name: finalName,
      type: paymentType,
      brand: paymentType === "efectivo" ? null : paymentBrand || null,
      bank: paymentType === "efectivo" ? null : paymentBank.trim() || null,
      credit_limit: paymentType === "credito" ? creditLimit : 0,
      current_balance: 0,
    })

    if (error) {
      alert(error.message)
      return
    }

    setPaymentName("")
    setPaymentType("efectivo")
    setPaymentBrand("")
    setPaymentBank("")
    setPaymentCreditLimit("")

    await fetchPaymentMethods()
  }

  async function deletePaymentMethod(id: string) {
    const { data: relatedMovements, error: checkError } = await supabase
      .from("movements")
      .select("id")
      .eq("payment_method_id", id)
      .limit(1)

    if (checkError) {
      alert(checkError.message)
      return
    }

    if (relatedMovements && relatedMovements.length > 0) {
      alert(
        "No puedes eliminar este medio de pago porque ya tiene movimientos asociados."
      )
      return
    }

    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar este medio de pago?"
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    await fetchPaymentMethods()
  }

  const orderedMasterCategories = useMemo(() => {
    return MASTER_CATEGORIES.map((masterCategory) => {
      const databaseCategory = categories.find(
        (category) =>
          normalizeName(category.name) === normalizeName(masterCategory.name)
      )

      return databaseCategory
        ? {
            ...databaseCategory,
            key: masterCategory.key,
            description: masterCategory.description,
            color: masterCategory.color,
          }
        : null
    }).filter(Boolean) as Array<
      Category & {
        key: string
        description: string
        color: string
      }
    >
  }, [categories])

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  const cardClass =
    "rounded-3xl border border-primary/20 bg-card p-5 lg:p-6"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Partidas, <span className="text-primary">Subpartidas</span> y medios
            de pago
          </h1>

          <p className="mt-1 text-sm text-textSecondary">
            Organiza tus movimientos con la metodología financiera de Smart
            Capital.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <section className="mb-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Metodología Smart Capital
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Ocho partidas financieras fijas
                </h2>

                <p className="mt-2 max-w-3xl text-sm text-textSecondary">
                  Las partidas principales mantienen una estructura estable
                  para que Presupuesto, Dashboard, Analytics y el coach
                  financiero utilicen la misma clasificación.
                </p>
              </div>

              <span className="w-fit rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary">
                Estructura protegida
              </span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className={cardClass}>
              <h2 className="text-xl font-bold">Partidas principales</h2>

              <p className="mt-2 text-sm text-textSecondary">
                Estas partidas son fijas y no se pueden crear, renombrar ni
                eliminar.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {loadingCategories ? (
                  <p className="text-textSecondary">
                    Preparando partidas principales...
                  </p>
                ) : (
                  orderedMasterCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`rounded-2xl border p-4 ${
                        category.key === "income"
                          ? "border-secondary/25 bg-secondary/5"
                          : "border-primary/20 bg-input"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3
                            className={`font-bold ${
                              category.key === "income"
                                ? "text-secondary"
                                : "text-primary"
                            }`}
                          >
                            {category.name}
                          </h3>

                          <p className="mt-2 text-sm text-textSecondary">
                            {category.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-textSecondary">
                          Fija
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold">Crear subpartida</h2>

              <p className="mt-2 text-sm text-textSecondary">
                Agrega el nivel de detalle que utilizarás al registrar tus
                movimientos.
              </p>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className={`mt-5 ${inputClass}`}
              >
                <option value="">Selecciona una partida</option>

                {orderedMasterCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                value={subcategoryName}
                onChange={(event) => setSubcategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void addSubcategory()
                  }
                }}
                placeholder="Ej: Supermercado"
                className={`mt-4 ${inputClass}`}
              />

              <button
                type="button"
                onClick={addSubcategory}
                disabled={savingSubcategory}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {savingSubcategory ? "Guardando..." : "Agregar subpartida"}
              </button>
            </section>
          </div>
                    <section className="mt-8 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Subpartidas por partida principal
                </h2>

                <p className="mt-2 text-sm text-textSecondary">
                  El presupuesto analizará el total consolidado de cada partida,
                  pero conservarás el detalle de sus subpartidas.
                </p>
              </div>

              <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                {subcategories.length} subpartidas
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {orderedMasterCategories.map((category) => {
                const relatedSubcategories = subcategories.filter(
                  (subcategory) =>
                    subcategory.category_id === category.id
                )

                const isIncome = category.key === "income"

                return (
                  <article
                    key={category.id}
                    className={`rounded-2xl border p-4 lg:p-5 ${
                      isIncome
                        ? "border-secondary/20 bg-secondary/5"
                        : "border-white/10 bg-input"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3
                          className={`break-words text-lg font-bold ${
                            isIncome ? "text-secondary" : "text-primary"
                          }`}
                        >
                          {category.name}
                        </h3>

                        <p className="mt-1 text-sm text-textSecondary">
                          {relatedSubcategories.length}{" "}
                          {relatedSubcategories.length === 1
                            ? "subpartida"
                            : "subpartidas"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          isIncome
                            ? "border-secondary/30 text-secondary"
                            : "border-primary/30 text-primary"
                        }`}
                      >
                        Partida fija
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {relatedSubcategories.length === 0 ? (
                        <p className="text-sm text-textSecondary/70">
                          Sin subpartidas todavía.
                        </p>
                      ) : (
                        relatedSubcategories.map((subcategory) => (
                          <span
                            key={subcategory.id}
                            className="flex max-w-full items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-textSecondary"
                          >
                            <span className="break-words">
                              {subcategory.name}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                deleteSubcategory(subcategory.id)
                              }
                              className="shrink-0 text-red-400 transition hover:text-red-300"
                              aria-label={`Eliminar subpartida ${subcategory.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Medios de pago</h2>

            <p className="mt-2 text-sm text-textSecondary">
              Registra efectivo, tarjetas de débito y tarjetas de crédito con
              límite disponible.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <select
                value={paymentType}
                onChange={(event) => {
                  const newType = event.target.value as
                    | "efectivo"
                    | "debito"
                    | "credito"

                  setPaymentType(newType)
                  setPaymentCreditLimit("")
                }}
                className={inputClass}
              >
                <option value="efectivo">Efectivo</option>
                <option value="debito">Tarjeta débito</option>
                <option value="credito">Tarjeta crédito</option>
              </select>

              {paymentType !== "efectivo" && (
                <>
                  <input
                    value={paymentBank}
                    onChange={(event) => setPaymentBank(event.target.value)}
                    placeholder="Banco"
                    className={inputClass}
                  />

                  <select
                    value={paymentBrand}
                    onChange={(event) => setPaymentBrand(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Marca</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Otra">Otra</option>
                  </select>

                  <input
                    value={paymentName}
                    onChange={(event) => setPaymentName(event.target.value)}
                    placeholder="Nombre opcional"
                    className={inputClass}
                  />

                  {paymentType === "credito" && (
                    <input
                      value={paymentCreditLimit}
                      onChange={(event) =>
                        setPaymentCreditLimit(event.target.value)
                      }
                      placeholder="Límite de crédito"
                      min="0"
                      step="0.01"
                      type="number"
                      className={inputClass}
                    />
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={addPaymentMethod}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90 sm:w-auto"
            >
              Agregar medio de pago
            </button>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paymentMethods.length === 0 ? (
                <p className="text-textSecondary">
                  Aún no tienes medios de pago registrados.
                </p>
              ) : (
                paymentMethods.map((method) => {
                  const limit = Number(method.credit_limit || 0)
                  const used = Number(method.current_balance || 0)
                  const available = Math.max(limit - used, 0)
                  const usage =
                    limit > 0 ? Math.round((used / limit) * 100) : 0

                  const formattedLimit = limit.toLocaleString("es-CR")
                  const formattedUsed = used.toLocaleString("es-CR")
                  const formattedAvailable =
                    available.toLocaleString("es-CR")

                  return (
                    <article
                      key={method.id}
                      className="rounded-2xl border border-white/10 bg-input p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-bold text-primary">
                            {method.name}
                          </h3>

                          <p className="mt-1 text-sm text-textSecondary">
                            {method.type === "efectivo"
                              ? "Efectivo"
                              : method.type === "debito"
                                ? "Débito"
                                : "Crédito"}
                          </p>

                          {method.bank && (
                            <p className="mt-1 break-words text-sm text-textSecondary">
                              Banco: {method.bank}
                            </p>
                          )}

                          {method.brand && (
                            <p className="mt-1 text-sm text-textSecondary">
                              Marca: {method.brand}
                            </p>
                          )}

                          {method.type === "credito" && (
                            <div className="mt-4 rounded-2xl border border-red-400/20 bg-card p-4">
                              <div className="grid gap-3 text-sm sm:grid-cols-3">
                                <div>
                                  <p className="text-textSecondary">Límite</p>

                                  <p className="break-words font-bold text-white">
                                    ₡{formattedLimit}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-textSecondary">Usado</p>

                                  <p className="break-words font-bold text-red-400">
                                    ₡{formattedUsed}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-textSecondary">
                                    Disponible
                                  </p>

                                  <p className="break-words font-bold text-secondary">
                                    ₡{formattedAvailable}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="mb-2 flex justify-between text-xs">
                                  <span className="text-textSecondary">Uso</span>

                                  <span
                                    className={`font-bold ${
                                      usage >= 80
                                        ? "text-red-400"
                                        : usage >= 50
                                          ? "text-primary"
                                          : "text-secondary"
                                    }`}
                                  >
                                    {usage}%
                                  </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-input">
                                  <div
                                    className={`h-full rounded-full transition-all ${
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
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deletePaymentMethod(method.id)}
                          className="shrink-0 rounded-full border border-red-400/40 px-3 py-1 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
                          aria-label={`Eliminar medio de pago ${method.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Categories