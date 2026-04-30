import { useState, useEffect } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmailIcon from '@mui/icons-material/Email';
import { getOrder, createPaymentSession, confirmBuyerReceipt, confirmSellerHandover, getInvoice, type Order, type Invoice } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccess('Payment successful! The seller has been notified.');
      // Mark as paid via the backend callback
      if (id) {
        fetch(`http://localhost:8080/orders/${id}/payment-success`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }).then(() => fetchOrder());
      }
    }
  }, [searchParams]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrder(parseInt(id!));
      setOrder(data);
      // Fetch invoice if order exists
      try {
        const inv = await getInvoice(parseInt(id!));
        setInvoice(inv);
      } catch { /* not critical */ }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    try {
      setError(null);
      const result = await createPaymentSession(order.id);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        setSuccess('Payment simulated successfully!');
        fetchOrder();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmBuyer = async () => {
    if (!order) return;
    try {
      setError(null);
      await confirmBuyerReceipt(order.id);
      setSuccess('Receipt confirmed!');
      fetchOrder();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmSeller = async () => {
    if (!order) return;
    try {
      setError(null);
      await confirmSellerHandover(order.id);
      setSuccess('Handover confirmed!');
      fetchOrder();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading order...</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography color="error">Order not found</Typography>
      </Box>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  // Progress steps
  const steps = ['Payment', 'Seller Confirmed', 'Buyer Confirmed', 'Completed'];
  let activeStep = 0;
  if (order.status === 'paid' || order.status === 'completed') activeStep = 1;
  if (order.seller_confirmed_at) activeStep = 2;
  if (order.buyer_confirmed_at && order.seller_confirmed_at) activeStep = 3;
  if (order.status === 'completed') activeStep = 4;

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(isBuyer ? '/my/purchases' : '/my/listings')}
            sx={{ color: 'rgba(255,255,255,0.75)', mb: 2, fontWeight: 600, '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.10)' } }}
          >
            Back
          </Button>
          <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Order #{order.id}
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
            {order.listing_title}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Progress Tracker */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(0,33,165,0.10)' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Order Details */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(0,33,165,0.10)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon sx={{ color: '#0021A5' }} /> Order Details
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={order.status.replace('_', ' ')}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: order.status === 'completed' ? '#2e7d32' : order.status === 'paid' ? '#0288d1' : '#FA4616',
                color: '#fff',
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Buyer</Typography>
            <Typography variant="body2" fontWeight={600}>{order.buyer_name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Seller</Typography>
            <Typography variant="body2" fontWeight={600}>{order.seller_name}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Invoice Breakdown */}
          {invoice && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Agreed Price</Typography>
                <Typography variant="body2" fontWeight={700}>${invoice.agreed_price.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Platform Fee ({invoice.platform_fee_percent}%)
                </Typography>
                <Typography variant="body2" color="text.secondary">-${invoice.platform_fee.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {isSeller ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" fontWeight={700}>You Receive</Typography>
                  <Typography variant="body1" fontWeight={800} color="primary">${invoice.seller_payout.toFixed(2)}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" fontWeight={700}>You Pay</Typography>
                  <Typography variant="body1" fontWeight={800} color="primary">${invoice.buyer_total.toFixed(2)}</Typography>
                </Box>
              )}
            </>
          )}
        </Paper>

        {/* Seller Contact Info (shown to buyer after payment) */}
        {isBuyer && order.status !== 'payment_pending' && order.seller_email && (
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid rgba(46,125,50,0.20)', backgroundColor: 'rgba(46,125,50,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ color: '#2e7d32' }} /> Seller Contact
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>{order.seller_name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: <strong>{order.seller_email}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Contact the seller to arrange pickup/delivery.
            </Typography>
          </Paper>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {isBuyer && order.status === 'payment_pending' && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PaymentIcon />}
              onClick={handlePay}
              sx={{ py: 1.5, backgroundColor: '#FA4616', fontWeight: 700, fontSize: '1rem', '&:hover': { backgroundColor: '#C73000' } }}
            >
              Pay ${order.agreed_price.toFixed(2)}
            </Button>
          )}

          {isSeller && order.status === 'paid' && !order.seller_confirmed_at && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LocalShippingIcon />}
              onClick={handleConfirmSeller}
              sx={{ py: 1.5, backgroundColor: '#0021A5', fontWeight: 700, fontSize: '1rem', '&:hover': { backgroundColor: '#001480' } }}
            >
              Confirm Item Handover
            </Button>
          )}

          {isBuyer && order.status === 'paid' && !order.buyer_confirmed_at && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<VerifiedIcon />}
              onClick={handleConfirmBuyer}
              sx={{ py: 1.5, backgroundColor: '#2e7d32', fontWeight: 700, fontSize: '1rem', '&:hover': { backgroundColor: '#1b5e20' } }}
            >
              Confirm Item Received
            </Button>
          )}

          {order.status === 'completed' && (
            <Alert severity="success" sx={{ width: '100%' }}>
              <Typography variant="body2" fontWeight={600}>
                🎉 This order is complete! Thank you for using GatorMarketplace.
              </Typography>
            </Alert>
          )}
        </Box>
      </Container>
    </Box>
  );
}
