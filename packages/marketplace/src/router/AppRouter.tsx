import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import MarketplaceApp from "../MarketplaceApp";
import DocsPage from "../pages/DocsPage";
import StatusPage from "../pages/StatusPage";
import TermsPage from "../pages/TermsPage";
import PrivacyPage from "../pages/PrivacyPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MarketplaceApp />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
