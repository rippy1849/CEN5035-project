package models

type User struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
	GoogleID  string `json:"google_id"`
	CreatedAt string `json:"created_at"`
}

type Session struct {
	Token     string `json:"token"`
	UserID    int    `json:"user_id"`
	CreatedAt string `json:"created_at"`
}

// GoogleTokenPayload represents the relevant fields from Google's tokeninfo response.
type GoogleTokenPayload struct {
	Sub     string `json:"sub"`      // Google user ID
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	HD      string `json:"hd"`       // Hosted domain (e.g. "ufl.edu")
	Aud     string `json:"aud"`      // Client ID the token was issued for
}
