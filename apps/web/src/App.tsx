import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScrollToAnchor } from './components/common/ScrollToAnchor';
import { LandingPage } from './pages/LandingPage';
import { ViewerPage } from './pages/ViewerPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { SecurityPage } from './pages/SecurityPage';
import { ContactPage } from './pages/ContactPage';
import { DocsPage } from './pages/DocsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { DownloadPage } from './pages/DownloadPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToAnchor />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;