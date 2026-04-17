import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Zahialga from './pages/Zahialga'
import HuvtsasniiUtga from './pages/HuvtsasniiUtga'
import BidniinTuhaid from './pages/BidniinTuhaid'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Footer from './components/Footer'
import TailorLayout from './pages/tailor/TailorLayout'
import TailorDashboard from './pages/tailor/TailorDashboard'
import TailorOrders from './pages/tailor/TailorOrders'
import TailorOrderDetail from './pages/tailor/TailorOrderDetail'
import TailorDesigns from './pages/tailor/TailorDesigns'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTailors from './pages/admin/AdminTailors'
import AdminOrders from './pages/admin/AdminOrders'

function App() {
  return (
    <Routes>
      {/* Auth pages — full screen, no navbar/footer */}
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin dashboard */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users"   element={<AdminUsers />} />
        <Route path="tailors" element={<AdminTailors />} />
        <Route path="orders"  element={<AdminOrders />} />
      </Route>

      {/* Tailor dashboard — өөрийн layout, navbar/footer байхгүй */}
      <Route path="/tailor" element={<TailorLayout />}>
        <Route index element={<TailorDashboard />} />
        <Route path="orders" element={<TailorOrders />} />
        <Route path="orders/:id" element={<TailorOrderDetail />} />
        <Route path="designs" element={<TailorDesigns />} />
      </Route>

      {/* Customer сайт */}
      <Route path="/*" element={
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/zahialga" element={<Zahialga />} />
            <Route path="/huvtsasnii-utga" element={<HuvtsasniiUtga />} />
            <Route path="/bidnii-tuhaid" element={<BidniinTuhaid />} />
          </Routes>
          <Footer />
        </div>
      } />
    </Routes>
  )
}

export default App
