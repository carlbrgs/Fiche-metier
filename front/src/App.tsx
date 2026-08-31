import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { MetiersPage } from '@/pages/MetiersPage';
import { MetierDetailPage } from '@/pages/MetierDetailPage';
import { ActivitesPage } from '@/pages/ActivitesPage';
import { ActiviteDetailPage } from '@/pages/ActiviteDetailPage';
import { FormacodesPage } from '@/pages/FormacodesPage';
import { FormacodeDetailPage } from '@/pages/FormacodeDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="metiers" element={<MetiersPage />} />
          <Route path="metiers/:code" element={<MetierDetailPage />} />
          <Route path="activites" element={<ActivitesPage />} />
          <Route path="activites/:code" element={<ActiviteDetailPage />} />
          <Route path="formacodes" element={<FormacodesPage />} />
          <Route path="formacodes/:code" element={<FormacodeDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
