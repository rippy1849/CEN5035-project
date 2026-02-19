import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <Header />
            <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
}
