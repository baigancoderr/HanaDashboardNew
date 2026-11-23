import { Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './App.css'
import { SectionReveal } from './Components/Motion'

// Landing page components
import Headers from './Components/Header'
import Footer from './Components/Footer'
import Hero from './Components/Hero'
import AboutUs from './Components/AboutUs'
import DAOpartner from './Components/DAOpartner'
import Ecosystem from './Components/Ecosystem'
import Tokonomics from './Components/Tokenomics'
import FAQ from './Components/FAQ'
import Token from './Components/Token'
import Roadmap from './Components/Roadmap'
import Team from './Components/Team'
import ContractAddress from './Components/ContractAddress'
import JoinUs from './Components/JoinUs'
import HanaProtocol from './Components/HanaProtocol'
import VisionMission from './Components/VisionMision'
import HanaFeatures from './Components/HanaFeatures'
import DSESection from './Components/DSESection'
import HanaStability from './Components/HanaStability'
import AuthPage from './auth/AuthPage'
import TokenEconomics from './Components/TokenEconomics'
import HanaArchitecture from './Components/HanaArchitecture'

// Blockchain Dashboard
import DashboardAccessGate from './dashboard/components/DashboardAccessGate'
import { HanaProvider } from './dashboard/context/HanaContext'
import { MainLayout } from './dashboard/components/layout/MainLayout'
import { DashboardPage } from './dashboard/pages/DashboardPage'
import { InvestmentPage } from './dashboard/pages/InvestmentPage'
import { StakingPage } from './dashboard/pages/StakingPage'
import { CompoundingPage } from './dashboard/pages/CompoundingPage'
import { DaoPage } from './dashboard/pages/DaoPage'
import { TokenPage } from './dashboard/pages/TokenPage'
import { MyTeamPage } from './dashboard/pages/MyTeamPage'
import { DirectIncomePage } from './dashboard/pages/DirectIncomePage'
import { LevelIncomePage } from './dashboard/pages/LevelIncomePage'
import { RewardsPage } from './dashboard/pages/RewardsPage'
import { RankPage } from './dashboard/pages/RankPage'
import { WithdrawPage } from './dashboard/pages/WithdrawPage'
import { TransactionsPage } from './dashboard/pages/TransactionsPage'
import { EcosystemPage } from './dashboard/pages/EcosystemPage'
import { SettingsPage } from './dashboard/pages/SettingsPage'
import {
  PackagesPage,
  ReferralPage,
  IncomeReportPage,
  RankRewardsPage,
  ResourcesPage,
  SupportPage,
} from './dashboard/pages/SecondaryPages'

// Landing page
function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <>
        <SectionReveal className="relative z-[100]"><Headers /></SectionReveal>
        <SectionReveal><Hero /></SectionReveal>
        <SectionReveal><HanaProtocol /></SectionReveal>
        <SectionReveal><AboutUs /></SectionReveal>
        <SectionReveal><VisionMission /></SectionReveal>
        <SectionReveal><DSESection /></SectionReveal>
        <SectionReveal><HanaArchitecture /></SectionReveal>
        {/* <SectionReveal><HanaStability /></SectionReveal> */}
        {/* <SectionReveal><DAOpartner /></SectionReveal> */}
        {/* <SectionReveal><TokenEconomics /></SectionReveal> */}
        <SectionReveal><Token /></SectionReveal>
        <SectionReveal><Tokonomics /></SectionReveal>
        {/* <SectionReveal><Ecosystem /></SectionReveal> */}
        <SectionReveal><HanaFeatures /></SectionReveal>
        <SectionReveal><Roadmap /></SectionReveal>
        {/* <SectionReveal><Team /></SectionReveal> */}
        <SectionReveal><FAQ /></SectionReveal>
        <SectionReveal><ContractAddress /></SectionReveal>
        <SectionReveal><JoinUs /></SectionReveal>
        <SectionReveal><Footer /></SectionReveal>
      </>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
    </MotionConfig>
  )
}

function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <DashboardAccessGate>
            <HanaProvider>
              <MainLayout />
            </HanaProvider>
          </DashboardAccessGate>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="investment" element={<InvestmentPage />} />
        <Route path="staking" element={<StakingPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="compounding" element={<CompoundingPage />} />
        <Route path="dao" element={<DaoPage />} />
        <Route path="token" element={<TokenPage />} />
        <Route path="tokenomics" element={<TokenPage />} />
        <Route path="team" element={<MyTeamPage />} />
        <Route path="my-team" element={<MyTeamPage />} />
        <Route path="referral" element={<ReferralPage />} />
        <Route path="direct-income" element={<DirectIncomePage />} />
        <Route path="level-income" element={<LevelIncomePage />} />
        <Route path="levels" element={<LevelIncomePage />} />
        <Route path="income-report" element={<IncomeReportPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="rank" element={<RankPage />} />
        <Route path="ranks" element={<RankPage />} />
        <Route path="rank-rewards" element={<RankRewardsPage />} />
        <Route path="withdraw" element={<WithdrawPage />} />
        <Route path="withdrawals" element={<WithdrawPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="ecosystem" element={<EcosystemPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
