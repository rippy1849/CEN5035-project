import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import theme from './theme';
import Layout from './components/layout/Layout';
import ListingsPage from './pages/ListingsPage';
import EditListingPage from './pages/EditListingPage';
import SellPage from './pages/SellPage';
import type { Listing } from './api/listings';

function ListingsView() {
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  if (editingListing) {
    return <EditListingPage listing={editingListing} onBack={() => setEditingListing(null)} />;
  }

  return <ListingsPage onEdit={setEditingListing} />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ListingsView />} />
            <Route path="sell" element={<SellPage />} />
            {/* Future routes can be added here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
