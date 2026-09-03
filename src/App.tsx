import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import Splash from './components/Splash'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Nutrition from './pages/Nutrition'
import Goals from './pages/Goals'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <AuthGate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="goals" element={<Goals />} />
          </Route>
        </Routes>
      </AuthGate>
    </>
  )
}
