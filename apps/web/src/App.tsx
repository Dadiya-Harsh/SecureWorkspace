import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScrollToAnchor } from './components/common/ScrollToAnchor';
import { LandingPage } from './pages/LandingPage';
import { ViewerPage } from './pages/ViewerPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { SecurityPage } from './pages/SecurityPage';
import { ContactPage } from './pages/ContactPage';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToAnchor />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
