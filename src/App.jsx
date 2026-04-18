import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import Exhibition from './Exhibition'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/exhibition" element={<Exhibition />} />
      </Routes>
    </BrowserRouter>
  )
}
