 import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../lib/supabase"

function Categories() {
  const [categoryName, setCategoryName] = useState("")
  const [subcategoryName, setSubcategoryName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
  }, [])

  async function fetchCategories() {
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("user_id", user.id)

    if (error) return console.log(error)

    setSubcategories(data || [])
  }

  async function addCategory() {
    if (!categoryName) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: categoryName,
    })

    if (error) {
      alert(error.message)
      return
    }

    setCategoryName("")
    fetchCategories()
  }

  async function addSubcategory() {
    if (!selectedCategory || !subcategoryName) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("subcategories").insert({
      user_id: user.id,
      category_id: selectedCategory,
      name: subcategoryName,
    })

    if (error) {
      alert(error.message)
      return
    }

    setSubcategoryName("")
    fetchSubcategories()
  }

  async function deleteCategory(categoryId: string) {
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

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-input px-4 py-3 text-white outline-none focus:border-primary/60"

  const cardClass = "rounded-3xl border border-primary/20 bg-card p-5 lg:p-6"

  return (
    <div className="min-h-screen bg-background text-white lg:flex">
      <Sidebar />

      <div className="w-full flex-1 overflow-x-hidden">
        <header className="border-b border-white/10 px-4 py-5 lg:px-8">
          <h1 className="text-2xl font-bold">
            Partidas y <span className="text-primary">Subpartidas</span>
          </h1>

          <p className="text-sm text-textSecondary">
            Administra las categorías que usarás en tus movimientos.
          </p>
        </header>

        <main className="p-4 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <h2 className="text-xl font-bold">Crear partida</h2>

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

                {categories.map((category) => (
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

          <div className="mt-8 rounded-3xl border border-white/10 bg-card p-5 lg:p-6">
            <h2 className="text-xl font-bold">Lista de partidas</h2>

            <div className="mt-6 space-y-4">
              {categories.length === 0 ? (
                <p className="text-textSecondary">
                  Aún no tienes partidas creadas.
                </p>
              ) : (
                categories.map((category) => {
                  const relatedSubcategories = subcategories.filter(
                    (sub) => sub.category_id === category.id
                  )

                  return (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-white/10 bg-input p-4 lg:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="break-words text-lg font-bold text-primary">
                          {category.name}
                        </h3>

                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="w-full rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400 sm:w-auto"
                        >
                          Eliminar
                        </button>
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