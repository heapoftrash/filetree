package config

// FieldKind is the type of a config field for UI rendering.
type FieldKind string

const (
	FieldString      FieldKind = "string"
	FieldBool        FieldKind = "bool"
	FieldBytes       FieldKind = "bytes"
	FieldStringSlice FieldKind = "string[]"
	FieldObjectSlice FieldKind = "object[]" // e.g. local_users
)

// FieldMeta describes a config field for the UI schema.
type FieldMeta struct {
	Section     string
	Key         string
	Kind        FieldKind
	Label       string
	Editable    bool
	Secret      bool
	DisplayHint string
	Placeholder string
	Extra       string // optional helper text shown below the input
}

// ProviderSchema describes one auth provider for the UI.
type ProviderSchema struct {
	ID     string
	Label  string
	Fields []FieldMeta
}

// AuthProviderSchemas defines all auth providers and their fields.
var AuthProviderSchemas = []ProviderSchema{
	{
		ID:    "google",
		Label: "Google",
		Fields: []FieldMeta{
			{Key: "enabled", Kind: FieldBool, Label: "Enabled", Editable: true},
			{Key: "client_id", Kind: FieldString, Label: "Client ID", Editable: true, Placeholder: "xxx.apps.googleusercontent.com"},
			{Key: "client_secret", Kind: FieldString, Label: "Client secret", Editable: true, Secret: true, Placeholder: "Enter once (cannot be changed after save)"},
			{Key: "callback_url", Kind: FieldString, Label: "Callback URL", Editable: true, Placeholder: "https://your-domain.com/api/auth/google/callback", Extra: "Add this exact URL as an authorized redirect URI in Google Cloud Console."},
		},
	},
	{
		ID:    "github",
		Label: "GitHub",
		Fields: []FieldMeta{
			{Key: "enabled", Kind: FieldBool, Label: "Enabled", Editable: true},
			{Key: "client_id", Kind: FieldString, Label: "Client ID", Editable: true, Placeholder: "GitHub OAuth App client ID"},
			{Key: "client_secret", Kind: FieldString, Label: "Client secret", Editable: true, Secret: true, Placeholder: "Enter once (cannot be changed after save)"},
			{Key: "callback_url", Kind: FieldString, Label: "Callback URL", Editable: true, Placeholder: "https://your-domain.com/api/auth/github/callback", Extra: "Add this exact URL as the Authorization callback URL in your GitHub OAuth App settings."},
		},
	},
}

// ConfigFields is the central registry of flat config fields.
var ConfigFields = []FieldMeta{
	// Server
	{Section: "server", Key: "root_path", Kind: FieldString, Label: "Root path", Editable: true, Placeholder: "./data"},
	{Section: "server", Key: "debug", Kind: FieldBool, Label: "Debug mode (Gin)", Editable: true},
	{Section: "server", Key: "max_upload_bytes", Kind: FieldBytes, Label: "Max upload size", Editable: true, DisplayHint: "bytes"},
	{Section: "server", Key: "frontend_url", Kind: FieldString, Label: "Frontend URL", Editable: true, Placeholder: "http://localhost:5173"},
	{Section: "server", Key: "cors_origins", Kind: FieldStringSlice, Label: "CORS origins", Editable: true},
	// Auth (shared)
	{Section: "auth", Key: "oauth_redirect_url", Kind: FieldString, Label: "OAuth Redirect URL", Editable: true, Placeholder: "https://your-domain.com/api/auth/google/callback", Extra: "Base URL for all OAuth providers. Use any provider's callback (e.g. .../api/auth/google/callback or .../api/auth/github/callback); the others are derived automatically."},
	{Section: "auth", Key: "jwt_secret_set", Kind: FieldBool, Label: "JWT secret", Editable: false, Secret: true},
	{Section: "auth", Key: "local_auth_enabled", Kind: FieldBool, Label: "Local users enabled", Editable: true},
	// Users
	{Section: "users", Key: "oauth_admin_emails", Kind: FieldStringSlice, Label: "Admins (OAuth)", Editable: true, Extra: "Full admin access. These addresses can sign in with Google or GitHub."},
	{Section: "users", Key: "oauth_allowed_emails", Kind: FieldStringSlice, Label: "Additional sign-ins (OAuth)", Editable: true, Extra: "Regular users who may sign in with OAuth (not admins)."},
	{Section: "users", Key: "oauth_allow_all_users", Kind: FieldBool, Label: "Allow all OAuth users", Editable: true, Extra: "Any OAuth user with an email can sign in; the lists above are ignored for sign-in. Admin access still follows the admin list only. Trusted environments only."},
	{Section: "users", Key: "local_users", Kind: FieldObjectSlice, Label: "Local users", Editable: true},
	{Section: "users", Key: "default_admin_username", Kind: FieldString, Label: "Default admin username", Editable: true, Placeholder: "admin"},
	{Section: "users", Key: "default_admin_password", Kind: FieldString, Label: "Default admin password", Editable: true, Secret: true, Placeholder: "Only used when no users exist"},
}
