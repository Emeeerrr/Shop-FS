import { Routes, Route, Navigate } from 'react-router-dom';
import { ShopPage } from './pages/ShopPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ShopPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
