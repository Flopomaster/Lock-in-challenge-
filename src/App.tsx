import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Bosses from './pages/Bosses'
import Dashboard from './pages/Dashboard'
import Graveyard from './pages/Graveyard'
import Locations from './pages/Locations'
import NewRun from './pages/NewRun'
import Runs from './pages/Runs'
import Settings from './pages/Settings'
import ShareImage from './pages/ShareImage'
import SoulLink from './pages/SoulLink'
import Stats from './pages/Stats'
import Team from './pages/Team'
import Wheel from './pages/Wheel'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="routes" element={<Locations />} />
        <Route path="team" element={<Team />} />
        <Route path="bosses" element={<Bosses />} />
        <Route path="graveyard" element={<Graveyard />} />
        <Route path="soul-link" element={<SoulLink />} />
        <Route path="wheel" element={<Wheel />} />
        <Route path="share" element={<ShareImage />} />
      </Route>
      <Route path="runs" element={<Runs />} />
      <Route path="runs/new" element={<NewRun />} />
      <Route path="settings" element={<Settings />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  )
}
