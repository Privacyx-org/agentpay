import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import MarketplaceApp from "../MarketplaceApp";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MarketplaceApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
