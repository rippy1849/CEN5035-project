import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import ListingsPage from './pages/ListingsPage';
import EditListingPage from './pages/EditListingPage';
import type { Listing } from './api/listings';

function App() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  if (selectedListing) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EditListingPage
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ListingsPage onEdit={setSelectedListing} />
    </ThemeProvider>
  );
}

export default App;
