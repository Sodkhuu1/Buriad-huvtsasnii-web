import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Zahialga from './pages/Zahialga'
import HuvtsasniiUtga from './pages/HuvtsasniiUtga'
import BidniinTuhaid from './pages/BidniinTuhaid'
import Footer from './components/Footer'
import TailorLayout from './pages/tailor/TailorLayout'
import TailorDashboard from './pages/tailor/TailorDashboard'
import TailorOrders from './pages/tailor/TailorOrders'
import TailorOrderDetail from './pages/tailor/TailorOrderDetail'

function App() {
  return (
    <Routes>
      {/* Tailor dashboard — өөрийн layout, navbar/footer байхгүй */}
      <Route path="/tailor" element={<TailorLayout />}>
        <Route index element={<TailorDashboard />} />
        <Route path="orders" element={<TailorOrders />} />
        <Route path="orders/:id" element={<TailorOrderDetail />} />
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
