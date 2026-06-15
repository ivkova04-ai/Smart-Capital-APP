 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Categories() {
  const [categoryName, setCategoryName] = useState("")
  const [subcategoryName, setSubcategoryName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])

  const [paymentName, setPaymentName] = useState("")
  const [paymentType, setPaymentType] = useState("efectivo")
  const [paymentBrand, setPaymentBrand] = useState("")
  const [paymentBank, setPaymentBank] = useState("")
  const [paymentCreditLimit, setPaymentCreditLimit] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
    fetchPaymentMethods()
    ensureIncomeCategory()
  }, [])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function ensureIncomeCategory() {
    const user = await getUser()
    if (!user) return

    const { data: existingIncome } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", "Ingreso")
      .maybeSingle()

    let incomeCategory = existingIncome

    if (!incomeCategory) {
      const { data: createdIncome, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: "Ingreso",
        })
        .select()
        .single()

      if (error) {
        alert(error.message)
        return
      }

      incomeCategory = createdIncome
    }

    const incomeSubcategories = [
      "Salario",
      "Servicios profesionales",
      "Regalías",
      "Comisión",
    ]

    const { data: existingSubs } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)
      .eq("category_id", incomeCategory.id)

    for (const subName of incomeSubcategories) {
      const exists = existingSubs?.some(
        (sub) => sub.name.toLowerCase() === subName.toLowerCase()
      )

      if (!exists) {
        await supabase.from("subcategories").insert({
          user_id: user.id,
          category_id: incomeCategory.id,
          name: subName,
        })
      }
    }

    fetchCategories()
    fetchSubcategories()
  }

  async function fetchCategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return console.log(error)

    setCategories(data || [])
  }

  async function fetchSubcategories() {
    const user = await getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)

    if (error) return console.log(error)

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
      console.log(error)
      return
    }

    setPaymentMethods(data || [])
  }

  async function addCategory() {
    if (!categoryName.trim()) return

    if (categoryName.trim().toLowerCase() === "ingreso") {
      alert("La partida Ingreso ya existe como partida fija.")
      return
    }

    const user = await getUser()
    if (!user) return

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: categoryName.trim(),
    })

    if (error) {
      alert(error.message)
      return
    }

    setCategoryName("")
    fetchCategories()
  }

  async function addSubcategory() {
    if (!selectedCategory || !subcategoryName.trim()) return

    const user = await getUser()
    if (!user) return

    const { error } = await supabase.from("subcategories").insert({
      user_id: user.id,
      category_id: selectedCategory,
      name: subcategoryName.trim(),
    })

    if (error) {
      alert(error.message)
      return
    }

    setSubcategoryName("")
    fetchSubcategories()
  }

  async function deleteCategory(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId)

    if (category?.name?.toLowerCase() === "ingreso") {
      alert("La partida Ingreso es fija y no se puede eliminar.")
      return
    }

    const { data: relatedMovements, error: checkError } = await supabase
      .from("movements")
      .select("id")
      .eq("category_id", categoryId)
      .limit(1)

    if (checkError) {
      alert(checkError.message)
      return
    }

    if (relatedMovements && relatedMovements.length > 0) {
      alert(
        "No puedes eliminar esta partida porque ya tiene movimientos asociados. Primero elimina o edita esos movimientos."
      )
      return
    }

    const confirmDelete = confirm("¿Seguro que quieres eliminar esta partida?")
    if (!confirmDelete) return

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)

    if (error) {
      alert(error.message)
      return
    }

    fetchCategories()
    fetchSubcategories()
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
        "No puedes eliminar esta subpartida porque ya tiene movimientos asociados. Primero elimina o edita esos movimientos."
      )
      return
    }

    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", subcategoryId)

    if (error) {
      alert(error.message)
      return
    }

    fetchSubcategories()
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

    const finalName =
      paymentType === "efectivo"
        ? "Efectivo"
        : paymentName.trim() || `${paymentBank} ${paymentBrand}`

    const { error } = await supabase.from("payment_methods").insert({
      user_id: user.id,
      name: finalName,
      type: paymentType,
      brand: paymentType === "efectivo" ? null : paymentBrand || null,
      bank: paymentType === "efectivo" ? null : paymentBank || null,
      credit_limit:
        paymentType === "credito" ? Number(paymentCreditLimit) : 0,
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
    fetchPaymentMethods()
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

    const confirmDelete = confirm("¿Seguro que quieres eliminar este medio de pago?")
    if (!confirmDelete) return

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    fetchPaymentMethods()
  }

  async function generateSuggestions() {
    const user = await getUser()
    if (!user) return

    const suggestions = [
      {
        category: "Emergencia",
        subcategories: ["Veterinario", "Médico"],
      },
      {
        category: "Hormiga",
        subcategories: ["Membresías", "Parqueos", "Heladería", "AM/PM"],
      },
      {
        category: "Lujos",
        subcategories: ["Salidas", "Spa", "Regalos", "Ropa"],
      },
      {
        category: "Educación",
        subcategories: ["Escuela", "Colegio", "Cursos"],
      },
      {
        category: "Básicos",
        subcategories: [
          "Alimentación",
          "Recibos",
          "Supermercado",
          "Feria del agricultor",
        ],
      },
      {
        category: "Transporte",
        subcategories: ["Gasolina", "Uber", "Taxi", "Mantenimiento", "Marchamo"],
      },
      {
        category: "Hogar",
        subcategories: [
          "Muebles",
          "Electrodomésticos",
          "Reparaciones",
          "Decoración",
        ],
      },
    ]

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)

    const { data: existingSubcategories } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)

    for (const item of suggestions) {
      let category = existingCategories?.find(
        (c) => c.name.toLowerCase() === item.category.toLowerCase()
      )

      if (!category) {
        const { data: createdCategory, error } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: item.category,
          })
          .select()
          .single()

        if (error) {
          alert(error.message)
          return
        }

        category = createdCategory
      }

      for (const subName of item.subcategories) {
        const exists = existingSubcategories?.find(
          (s) =>
            s.category_id === category.id &&
            s.name.toLowerCase() === subName.toLowerCase()
        )

        if (!exists) {
          await supabase.from("subcategories").insert({
            user_id: user.id,
            category_id: category.id,
            name: subName,
          })
        }
      }
    }

    await ensureIncomeCategory()
    await fetchCategories()
    await fetchSubcategories()

    alert("Sugerencias generadas correctamente.")
  }

  const incomeCategory = categories.find(
    (category) => category.name.toLowerCase() === "ingreso"
  )

  const expenseCategories = categories.filter(
    (category) => category.name.toLowerCase() !== "ingreso"
  )

  const orderedCategories = incomeCategory
    ? [incomeCategory, ...expenseCategories]
    : expenseCategories

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  const cardClass = "rounded-3xl border border-primary/20 bg-card p-5 lg:p-6"
    return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Partidas, <span className="text-primary">Subpartidas</span> y medios de pago
          </h1>

          <p className="text-sm text-textSecondary">
            Administra tus categorías, partida fija de ingresos y tarjetas inteligentes.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8 rounded-3xl border border-primary/20 bg-card p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Sugerencias Smart Capital</h2>

                <p className="mt-2 text-sm text-textSecondary">
                  Genera partidas de gasto base. La partida Ingreso se mantiene fija.
                </p>
              </div>

              <button
                onClick={generateSuggestions}
                className="w-full rounded-full bg-white px-6 py-3 font-extrabold text-primary shadow-[0_0_30px_rgba(105,103,251,0.45)] transition hover:scale-[1.02] sm:w-auto"
              >
                ✨ Generar sugerencias
              </button>
            </div>
          </div>

          {incomeCategory && (
            <div className="mb-8 rounded-3xl border border-secondary/20 bg-card p-5 lg:p-6">
              <p className="text-sm font-bold text-secondary">Partida fija</p>
              <h2 className="mt-1 text-2xl font-bold">Ingreso</h2>

              <p className="mt-2 text-sm text-textSecondary">
                Esta partida no se puede eliminar. Sus subpartidas sí se pueden administrar.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {subcategories
                  .filter((sub) => sub.category_id === incomeCategory.id)
                  .map((sub) => (
                    <span
                      key={sub.id}
                      className="flex items-center gap-2 rounded-full bg-input px-4 py-2 text-sm text-textSecondary"
                    >
                      {sub.name}

                      <button
                        onClick={() => deleteSubcategory(sub.id)}
                        className="text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h2 className="text-xl font-bold">Crear partida de gasto</h2>

              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej: Alimentación"
                className={`mt-4 ${inputClass}`}
              />

              <button
                onClick={addCategory}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
              >
                Agregar partida
              </button>
            </div>

            <div className={cardClass}>
              <h2 className="text-xl font-bold">Crear subpartida</h2>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`mt-4 ${inputClass}`}
              >
                <option value="">Selecciona una partida</option>

                {orderedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="Ej: Supermercado"
                className={`mt-4 ${inputClass}`}
              />

              <button
                onClick={addSubcategory}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
              >
                Agregar subpartida
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Medios de pago</h2>

            <p className="mt-2 text-sm text-textSecondary">
              Registra efectivo, tarjetas de débito y tarjetas de crédito con límite disponible.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <select
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value)
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
                    onChange={(e) => setPaymentBank(e.target.value)}
                    placeholder="Banco"
                    className={inputClass}
                  />

                  <select
                    value={paymentBrand}
                    onChange={(e) => setPaymentBrand(e.target.value)}
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
                    onChange={(e) => setPaymentName(e.target.value)}
                    placeholder="Nombre opcional"
                    className={inputClass}
                  />

                  {paymentType === "credito" && (
                    <input
                      value={paymentCreditLimit}
                      onChange={(e) => setPaymentCreditLimit(e.target.value)}
                      placeholder="Límite de crédito"
                      type="number"
                      className={inputClass}
                    />
                  )}
                </>
              )}
            </div>

            <button
              onClick={addPaymentMethod}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 font-bold text-white sm:w-auto"
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
                  const usage = limit > 0 ? Math.round((used / limit) * 100) : 0

                  return (
                    <div
                      key={method.id}
                      className="rounded-2xl border border-white/10 bg-input p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-full">
                          <h3 className="font-bold text-primary">
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
                            <p className="mt-1 text-sm text-textSecondary">
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
                                  <p className="font-bold text-white">
                                    ₡{limit}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-textSecondary">Usado</p>
                                  <p className="font-bold text-red-400">
                                    ₡{used}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-textSecondary">Disponible</p>
                                  <p className="font-bold text-secondary">
                                    ₡{available}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="mb-2 flex justify-between text-xs">
                                  <span className="text-textSecondary">Uso</span>
                                  <span className="font-bold text-red-400">
                                    {usage}%
                                  </span>
                                </div>

                                <div className="h-3 rounded-full bg-input">
                                  <div
                                    className={`h-3 rounded-full ${
                                      usage >= 80
                                        ? "bg-red-400"
                                        : usage >= 50
                                        ? "bg-primary"
                                        : "bg-secondary"
                                    }`}
                                    style={{ width: `${Math.min(usage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => deletePaymentMethod(method.id)}
                          className="rounded-full border border-red-400/40 px-3 py-1 text-sm font-bold text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Lista de partidas</h2>

            <div className="mt-6 space-y-4">
              {orderedCategories.length === 0 ? (
                <p className="text-textSecondary">
                  Aún no tienes partidas creadas.
                </p>
              ) : (
                orderedCategories.map((category) => {
                  const isIncome = category.name.toLowerCase() === "ingreso"
                  const relatedSubcategories = subcategories.filter(
                    (sub) => sub.category_id === category.id
                  )

                  return (
                    <div
                      key={category.id}
                      className={`rounded-2xl border p-4 lg:p-5 ${
                        isIncome
                          ? "border-secondary/20 bg-secondary/5"
                          : "border-white/10 bg-input"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3
                            className={`break-words text-lg font-bold ${
                              isIncome ? "text-secondary" : "text-primary"
                            }`}
                          >
                            {category.name}
                          </h3>

                          {isIncome && (
                            <p className="mt-1 text-sm text-textSecondary">
                              Partida fija para registrar ingresos.
                            </p>
                          )}
                        </div>

                        {isIncome ? (
                          <span className="w-fit rounded-full border border-secondary/30 px-4 py-2 text-sm font-bold text-secondary">
                            No eliminable
                          </span>
                        ) : (
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="w-full rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400 sm:w-auto"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {relatedSubcategories.length === 0 ? (
                          <p className="text-sm text-textSecondary/70">
                            Sin subpartidas todavía.
                          </p>
                        ) : (
                          relatedSubcategories.map((sub) => (
                            <span
                              key={sub.id}
                              className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-textSecondary"
                            >
                              {sub.name}

                              <button
                                onClick={() => deleteSubcategory(sub.id)}
                                className="text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Categories