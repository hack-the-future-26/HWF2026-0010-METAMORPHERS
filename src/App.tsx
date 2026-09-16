import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicShell } from '@/components/layout/PublicShell'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { PlanTripPage } from '@/pages/PlanTripPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { MyTripPage } from '@/pages/MyTripPage'
import { LiveTripPage } from '@/pages/LiveTripPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { SavedPlacesPage } from '@/pages/SavedPlacesPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { FoodPage } from '@/pages/FoodPage'
import { StayPage } from '@/pages/StayPage'
import { TranslatePage } from '@/pages/TranslatePage'

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="/arrive" element={<HomePage />} />
          <Route path="/plan" element={<PlanTripPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/stay" element={<StayPage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/transport" element={<Navigate to="/trip" replace />} />
          <Route path="/trip" element={<MyTripPage />} />
          <Route path="/live" element={<LiveTripPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/saved" element={<SavedPlacesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
