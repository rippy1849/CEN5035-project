package models

type Bid struct {
	ID            int      `json:"id"`
	ListingID     int      `json:"listing_id"`
	BuyerID       int      `json:"buyer_id"`
	BuyerName     string   `json:"buyer_name,omitempty"`
	Amount        float64  `json:"amount"`
	Status        string   `json:"status"`
	CounterAmount *float64 `json:"counter_amount"`
	BidNumber     int      `json:"bid_number"`
	CreatedAt     string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
}
