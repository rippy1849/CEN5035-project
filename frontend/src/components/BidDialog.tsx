import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import GavelIcon from '@mui/icons-material/Gavel';
import { placeBid, getBids, type Bid } from '../api/bids';
import type { Listing } from '../api/listings';

interface BidDialogProps {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  onBidPlaced?: () => void;
}

export default function BidDialog({ open, onClose, listing, onBidPlaced }: BidDialogProps) {
  const [amount, setAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsRemaining, setBidsRemaining] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && listing.id) {
      fetchBids();
    }
  }, [open, listing.id]);

  const fetchBids = async () => {
    if (!listing.id) return;
    try {
      const data = await getBids(listing.id);
      setBids(data.bids);
      setBidsRemaining(data.bids_remaining);
    } catch {
      // Non-critical — user may not be authenticated
    }
  };

  const handleSubmit = async () => {
    if (!listing.id || !amount) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const result = await placeBid(listing.id, parseFloat(amount));
      setBidsRemaining(result.bids_remaining);
      setSuccess(`Bid of $${parseFloat(amount).toFixed(2)} placed! ${result.bids_remaining} bids remaining.`);
      setAmount('');
      fetchBids();
      onBidPlaced?.();
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const lastBid = bids.length > 0 ? bids[bids.length - 1] : null;
  const hasAcceptedBid = bids.some(b => b.status === 'accepted');
  const isDisabled = bidsRemaining <= 0 || listing.is_final_price || hasAcceptedBid;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GavelIcon sx={{ color: '#0021A5' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Place a Bid
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {listing.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Current price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Listed price:</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FA4616' }}>
            ${listing.price.toLocaleString()}
          </Typography>
          {listing.is_final_price && (
            <Chip label="Final Price" size="small" sx={{ backgroundColor: '#FA4616', color: '#fff', fontWeight: 600 }} />
          )}
        </Box>

        {/* Bids remaining */}
        <Chip
          label={`${bidsRemaining} of 5 bids remaining`}
          size="small"
          variant="outlined"
          sx={{
            mb: 2,
            fontWeight: 600,
            borderColor: bidsRemaining > 0 ? '#0021A5' : '#d32f2f',
            color: bidsRemaining > 0 ? '#0021A5' : '#d32f2f',
          }}
        />

        {/* Status messages */}
        {hasAcceptedBid && (
          <Alert severity="success" sx={{ mb: 2 }}>A bid has been accepted for this listing.</Alert>
        )}
        {listing.is_final_price && !hasAcceptedBid && (
          <Alert severity="warning" sx={{ mb: 2 }}>The seller has marked this price as final. No more bids accepted.</Alert>
        )}

        {/* Last counter offer */}
        {lastBid?.status === 'countered' && lastBid.counter_amount && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Seller counter-offered: <strong>${lastBid.counter_amount.toFixed(2)}</strong>
          </Alert>
        )}

        {/* Bid history */}
        {bids.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Your Bid History</Typography>
            {bids.map((bid) => (
              <Box
                key={bid.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.75,
                  px: 1.5,
                  mb: 0.5,
                  borderRadius: 1,
                  backgroundColor: bid.status === 'accepted'
                    ? 'rgba(46,125,50,0.08)'
                    : bid.status === 'countered'
                    ? 'rgba(2,136,209,0.08)'
                    : bid.status === 'rejected'
                    ? 'rgba(211,47,47,0.06)'
                    : 'rgba(0,0,0,0.03)',
                }}
              >
                <Typography variant="body2">
                  Bid #{bid.bid_number}: <strong>${bid.amount.toFixed(2)}</strong>
                </Typography>
                <Chip
                  label={bid.status}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    backgroundColor:
                      bid.status === 'accepted' ? '#2e7d32' :
                      bid.status === 'countered' ? '#0288d1' :
                      bid.status === 'rejected' ? '#d32f2f' : '#757575',
                    color: '#fff',
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Bid input */}
        {!isDisabled && (
          <TextField
            label="Your Bid Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0.01, step: '0.01' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            placeholder="Enter your bid"
            disabled={loading}
          />
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {!isDisabled && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            startIcon={loading ? <CircularProgress size={16} /> : <GavelIcon />}
            sx={{
              backgroundColor: '#0021A5',
              '&:hover': { backgroundColor: '#001480' },
            }}
          >
            Submit Bid
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
