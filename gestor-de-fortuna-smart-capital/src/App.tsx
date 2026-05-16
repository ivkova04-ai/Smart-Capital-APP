 import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard.tsx"
import Movements from "./pages/Movements"
import Categories from "./pages/Categories"
import Goals from "./pages/Goals"
import Budget from "./pages/Budget"
import Wealth from "./pages/Wealth"
import Analytics from "./pages/Analytics"
import Settings from "./pages/Settings"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/movimientos" element={<Movements />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/presupuesto" element={<Budget />} />
        <Route path="/patrimonio" element={<Wealth />} />
        <Route path="/metas" element={<Goals />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/configuracion" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App