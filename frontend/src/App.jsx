import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import CohortAnalysis from "./pages/CohortAnalysis";
import CustomerExplorer from "./pages/CustomerExplorer";
import Overview from "./pages/Overview";
import RevenueRisk from "./pages/RevenueRisk";

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="fixed inset-0 -z-10 bg-hero-grid opacity-80" />
      <div className="fixed inset-x-0 top-[-12rem] -z-10 mx-auto h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="fixed bottom-[-8rem] right-[-5rem] -z-10 h-80 w-80 rounded-full bg-info/10 blur-3xl" />
      <div className="fixed left-[22%] top-[18%] -z-10 h-40 w-40 rounded-full border border-white/5 bg-white/[0.02] blur-2xl" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />
          <main className="animate-enter flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/customers" element={<CustomerExplorer />} />
              <Route path="/cohorts" element={<CohortAnalysis />} />
              <Route path="/revenue" element={<RevenueRisk />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
