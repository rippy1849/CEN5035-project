import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplyIcon from '@mui/icons-material/Reply';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import { getBids, respondToBid, markFinalPrice, unmarkFinalPrice, type Bid } from '../api/bids';

interface BidManagementPanelProps {
  listingId: number;
  isFinalPrice?: boolean;
  onUpdate?: () => void;
}

export default function BidManagementPanel({ listingId, isFinalPrice, onUpdate }: BidManagementPanelProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<number, string>>({});
  const [showCounterInput, setShowCounterInput] = useState<number | null>(null);
  const [isFinal, setIsFinal] = useState(isFinalPrice ?? false);

  useEffect(() => {
    setIsFinal(isFinalPrice ?? false);
  }, [isFinalPrice]);

  useEffect(() => {
    fetchBids();
  }, [listingId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const data = await getBids(listingId);
      setBids(data.bids);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (bidId: number, action: 'accept' | 'counter' | 'reject') => {
    try {
      setError(null);
      const counterAmount = action === 'counter' ? parseFloat(counterAmounts[bidId] || '0') : undefined;
      await respondToBid(bidId, action, counterAmount);
      setShowCounterInput(null);
      fetchBids();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleFinalPrice = async () => {
    try {
      setError(null);
      if (isFinal) {
        await unmarkFinalPrice(listingId);
        setIsFinal(false);
      } else {
        await markFinalPrice(listingId);
        setIsFinal(true);
      }
      onUpdate?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(0,33,165,0.10)',
        overflow: 'hidden',
        mt: 3,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          background: 'linear-gradient(135deg, #001480 0%, #0021A5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon sx={{ color: '#FA4616', fontSize: '1.25rem' }} />
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>
            Bids Received ({bids.length})
          </Typography>
        </Box>

        {/* Toggle Final Price button */}
        {isFinal ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={handleToggleFinalPrice}
            sx={{
              backgroundColor: '#2e7d32',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
          >
            Price Marked as Final ✓
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<LockIcon />}
            onClick={handleToggleFinalPrice}
            sx={{
              borderColor: 'rgba(255,255,255,0.4)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#FA4616', color: '#FA4616' },
            }}
          >
            Mark Price as Final
          </Button>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {bids.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No bids received yet.
          </Typography>
        ) : (
          bids.map((bid, idx) => (
            <Box key={bid.id}>
              {idx > 0 && <Divider sx={{ my: 1.5 }} />}
              <Box
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  backgroundColor:
                    bid.status === 'accepted' ? 'rgba(46,125,50,0.06)' :
                    bid.status === 'countered' ? 'rgba(2,136,209,0.04)' :
                    bid.status === 'rejected' ? 'rgba(211,47,47,0.04)' :
                    'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {bid.buyer_name || `User #${bid.buyer_id}`}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0021A5' }}>
                      ${bid.amount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={bid.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        mb: 0.5,
                        backgroundColor:
                          bid.status === 'accepted' ? '#2e7d32' :
                          bid.status === 'countered' ? '#0288d1' :
                          bid.status === 'rejected' ? '#d32f2f' : '#757575',
                        color: '#fff',
                      }}
                    />
                    {bid.counter_amount && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Counter: ${bid.counter_amount.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Action buttons for pending bids */}
                {bid.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleRespond(bid.id, 'accept')}
                      sx={{
                        backgroundColor: '#2e7d32',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flex: 1,
                        '&:hover': { backgroundColor: '#1b5e20' },
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ReplyIcon />}
                      onClick={() => setShowCounterInput(showCounterInput === bid.id ? null : bid.id)}
                      sx={{
                        borderColor: '#0288d1',
                        color: '#0288d1',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flex: 1,
                      }}
                    >
                      Counter
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => handleRespond(bid.id, 'reject')}
                      sx={{
                        borderColor: '#d32f2f',
                        color: '#d32f2f',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flex: 1,
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                )}

                {/* Counter input */}
                {showCounterInput === bid.id && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Your counter price"
                      value={counterAmounts[bid.id] || ''}
                      onChange={(e) => setCounterAmounts(prev => ({ ...prev, [bid.id]: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      inputProps={{ min: 0.01, step: '0.01' }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleRespond(bid.id, 'counter')}
                      disabled={!counterAmounts[bid.id] || parseFloat(counterAmounts[bid.id]) <= 0}
                      sx={{ backgroundColor: '#0288d1', fontWeight: 600 }}
                    >
                      Send
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}
