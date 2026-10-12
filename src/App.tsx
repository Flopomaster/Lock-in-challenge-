import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Graveyard from './pages/Graveyard'
import Locations from './pages/Locations'
import NewRun from './pages/NewRun'
import Runs from './pages/Runs'
import Settings from './pages/Settings'
import Team from './pages/Team'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="routes" element={<Locations />} />
        <Route path="team" element={<Team />} />
        <Route path="graveyard" element={<Graveyard />} />
      </Route>
      <Route path="runs" element={<Runs />} />
      <Route path="runs/new" element={<NewRun />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  )
}
