import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ListingsPage from './pages/ListingsPage';
import EditListingPage from './pages/EditListingPage';
import SellPage from './pages/SellPage';
import LoginPage from './pages/LoginPage';
import MyPurchasesPage from './pages/MyPurchasesPage';
import MyListingsPage from './pages/MyListingsPage';
import OrderDetailPage from './pages/OrderDetailPage';
import type { Listing } from './api/listings';

const GOOGLE_CLIENT_ID = '134462445465-636p004nsjkj0ndtvdo2038pkm592qnm.apps.googleusercontent.com';

function ListingsView() {
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  if (editingListing) {
    return <EditListingPage listing={editingListing} onBack={() => setEditingListing(null)} />;
  }

  return <ListingsPage onEdit={setEditingListing} />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ListingsView />} />
                <Route path="sell" element={<SellPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="my/purchases" element={<MyPurchasesPage />} />
                <Route path="my/listings" element={<MyListingsPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
