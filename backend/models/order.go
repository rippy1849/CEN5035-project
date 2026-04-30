package models

type Order struct {
	ID                int      `json:"id"`
	ListingID         int      `json:"listing_id"`
	BidID             int      `json:"bid_id"`
	BuyerID           int      `json:"buyer_id"`
	SellerID          int      `json:"seller_id"`
	AgreedPrice       float64  `json:"agreed_price"`
	PlatformFee       float64  `json:"platform_fee"`
	SellerPayout      float64  `json:"seller_payout"`
	Status            string   `json:"status"` // payment_pending, paid, completed
	StripeSessionID   *string  `json:"stripe_session_id"`
	BuyerConfirmedAt  *string  `json:"buyer_confirmed_at"`
	SellerConfirmedAt *string  `json:"seller_confirmed_at"`
	CreatedAt         string   `json:"created_at"`
	UpdatedAt         string   `json:"updated_at"`
	// Joined fields for API responses
	ListingTitle      string   `json:"listing_title,omitempty"`
	ListingImage      string   `json:"listing_image,omitempty"`
	BuyerName         string   `json:"buyer_name,omitempty"`
	SellerName        string   `json:"seller_name,omitempty"`
	SellerEmail       string   `json:"seller_email,omitempty"`
}
