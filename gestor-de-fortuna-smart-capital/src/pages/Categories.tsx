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
      console.log(error)
      return
    }

    setCategories(data)
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
      console.log(error)
      return
    }

    setSubcategories(data)
  }

  async function addCategory() {
    if (!categoryName) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("categories")
      .insert({
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const category = categories.find(
      (cat) => cat.id === selectedCategory
    )

    if (!category) return

    const { error } = await supabase
      .from("subcategories")
      .insert({
        user_id: user.id,
        category_id: category.id,
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
    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar esta partida?"
    )

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

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-white/10 px-8 py-5">
          <h1 className="text-2xl font-bold">
            Partidas y <span className="text-[#E0B04B]">Subpartidas</span>
          </h1>

          <p className="text-sm text-gray-400">
            Administra las categorías que usarás en tus movimientos.
          </p>
        </header>

        <main className="p-8">
          <div className="grid gap-6 md:grid-cols-2">

            <div className="rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-6">
              <h2 className="text-xl font-bold">
                Crear partida
              </h2>

              <input
                value={categoryName}
                onChange={(e) =>
                  setCategoryName(e.target.value)
                }
                placeholder="Ej: Alimentación"
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              />

              <button
                onClick={addCategory}
                className="mt-4 rounded-full bg-[#E0B04B] px-6 py-3 font-bold text-black"
              >
                Agregar partida
              </button>
            </div>

            <div className="rounded-3xl border border-[#E0B04B]/20 bg-[#1a1a1a] p-6">
              <h2 className="text-xl font-bold">
                Crear subpartida
              </h2>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value)
                }
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              >
                <option value="">
                  Selecciona una partida
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                value={subcategoryName}
                onChange={(e) =>
                  setSubcategoryName(e.target.value)
                }
                placeholder="Ej: Supermercado"
                className="mt-4 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 outline-none"
              />

              <button
                onClick={addSubcategory}
                className="mt-4 rounded-full bg-[#E0B04B] px-6 py-3 font-bold text-black"
              >
                Agregar subpartida
              </button>
            </div>

          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#1a1a1a] p-6">
            <h2 className="text-xl font-bold">
              Lista de partidas
            </h2>

            <div className="mt-6 space-y-4">

              {categories.length === 0 ? (

                <p className="text-gray-400">
                  Aún no tienes partidas creadas.
                </p>

              ) : (

                categories.map((category) => {

                  const relatedSubcategories =
                    subcategories.filter(
                      (sub) =>
                        sub.category_id === category.id
                    )

                  return (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-white/10 bg-[#111111] p-5"
                    >

                      <div className="flex items-center justify-between">

                        <h3 className="text-lg font-bold text-[#E0B04B]">
                          {category.name}
                        </h3>

                        <button
                          onClick={() =>
                            deleteCategory(category.id)
                          }
                          className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-bold text-red-400"
                        >
                          Eliminar
                        </button>

                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">

                        {relatedSubcategories.length === 0 ? (

                          <p className="text-sm text-gray-500">
                            Sin subpartidas todavía.
                          </p>

                        ) : (

                          relatedSubcategories.map((sub) => (

                            <span
                              key={sub.id}
                              className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-sm text-gray-300"
                            >

                              {sub.name}

                              <button
                                onClick={() =>
                                  deleteSubcategory(sub.id)
                                }
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