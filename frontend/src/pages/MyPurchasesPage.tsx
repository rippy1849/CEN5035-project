import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GavelIcon from '@mui/icons-material/Gavel';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getMyBids, acceptCounter, type BidWithListing } from '../api/bids';
import { getMyOrders, createPaymentSession, type Order } from '../api/orders';
import { useAuth } from '../context/AuthContext';

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [bids, setBids] = useState<BidWithListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bidsData, ordersData] = await Promise.all([getMyBids(), getMyOrders()]);
      setBids(bidsData);
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCounter = async (bidId: number) => {
    try {
      setError(null);
      const result = await acceptCounter(bidId);
      if (result.order_id) {
        navigate(`/orders/${result.order_id}`);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept counter');
    }
  };

  const handlePay = async (orderId: number) => {
    try {
      setError(null);
      const result = await createPaymentSession(orderId);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        // Simulated payment
        fetchData();
        navigate(`/orders/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    }
  };

  // Group bids by listing
  const bidsByListing = bids.reduce((acc, bid) => {
    if (!acc[bid.listing_id]) acc[bid.listing_id] = [];
    acc[bid.listing_id].push(bid);
    return acc;
  }, {} as Record<number, BidWithListing[]>);

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#2e7d32';
      case 'countered': return '#0288d1';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ShoppingBagIcon sx={{ color: '#FA4616', fontSize: '1.5rem' }} />
            <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
              My Purchases
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
            Track your bids, payments, and deliveries
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Active Orders */}
        {orders.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon sx={{ color: '#0021A5' }} /> Active Orders
            </Typography>
            {orders.map((order) => (
              <Paper
                key={order.id}
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(0,33,165,0.10)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#0021A5', boxShadow: '0 4px 20px rgba(0,33,165,0.08)' },
                }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {order.listing_image && (
                      <Box
                        component="img"
                        src={`http://localhost:8080${order.listing_image}`}
                        sx={{ width: 60, height: 60, borderRadius: 2, objectFit: 'cover' }}
                      />
                    )}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {order.listing_title || `Order #${order.id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Agreed: <strong>${order.agreed_price.toFixed(2)}</strong> • Seller: {order.seller_name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={order.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        backgroundColor: order.status === 'completed' ? '#2e7d32' : order.status === 'paid' ? '#0288d1' : '#FA4616',
                        color: '#fff',
                        textTransform: 'capitalize',
                      }}
                    />
                    {order.status === 'payment_pending' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={(e) => { e.stopPropagation(); handlePay(order.id); }}
                        sx={{ mt: 1, backgroundColor: '#FA4616', fontWeight: 600, fontSize: '0.75rem', '&:hover': { backgroundColor: '#C73000' } }}
                      >
                        Pay Now
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Bids by Listing */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon sx={{ color: '#0021A5' }} /> My Bids
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
        ) : Object.keys(bidsByListing).length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h3" sx={{ mb: 1, opacity: 0.3 }}>🛒</Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No bids placed yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Browse the marketplace and place your first bid!
            </Typography>
          </Box>
        ) : (
          Object.entries(bidsByListing).map(([listingId, listingBids]) => {
            const first = listingBids[0];
            const imgSrc = first.listing_image
              ? `http://localhost:8080${first.listing_image}`
              : `https://picsum.photos/seed/${listingId}/400/300`;

            return (
              <Paper
                key={listingId}
                elevation={0}
                sx={{ mb: 2, borderRadius: 3, border: '1px solid rgba(0,33,165,0.10)', overflow: 'hidden' }}
              >
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={imgSrc}
                    alt={first.listing_title}
                    sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{first.listing_title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Listed at <strong>${first.listing_price.toFixed(2)}</strong>
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 2.5 }}>
                  {listingBids.map((bid) => (
                    <Box key={bid.id} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          Bid #{bid.bid_number}: <strong>${bid.amount.toFixed(2)}</strong>
                        </Typography>
                        <Chip
                          label={bid.status}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', backgroundColor: statusColor(bid.status), color: '#fff' }}
                        />
                      </Box>
                      {bid.status === 'countered' && bid.counter_amount && (
                        <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(2,136,209,0.06)', border: '1px solid rgba(2,136,209,0.15)' }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Seller countered at <strong>${bid.counter_amount.toFixed(2)}</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleAcceptCounter(bid.id)}
                              sx={{ backgroundColor: '#2e7d32', fontWeight: 600, fontSize: '0.75rem', '&:hover': { backgroundColor: '#1b5e20' } }}
                            >
                              Accept ${bid.counter_amount.toFixed(2)}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            );
          })
        )}
      </Container>
    </Box>
  );
}
