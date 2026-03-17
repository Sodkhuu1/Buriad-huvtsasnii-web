import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Zahialga from './pages/Zahialga'
import HuvtsasniiUtga from './pages/HuvtsasniiUtga'
import BidniinTuhaid from './pages/BidniinTuhaid'
import Footer from './components/Footer'

function App() {
  return (
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
  )
}

export default App
