package config

import "sync/atomic"

// LiveConfig holds the current application config with atomic snapshot reads and publishes.
// Callers must treat Snapshot() return values as read-only; Replace swaps in a new pointer
// that must not be mutated after publish.
type LiveConfig struct {
	v atomic.Value // *Config
}

// NewLiveConfig wraps cfg for concurrent access. The same pointer is stored until the first Replace.
func NewLiveConfig(cfg *Config) *LiveConfig {
	l := &LiveConfig{}
	if cfg == nil {
		l.v.Store(&Config{})
	} else {
		l.v.Store(cfg)
	}
	return l
}

// Snapshot returns the current config for read-only use. It is safe to call from any goroutine
// concurrently with Replace: each load observes one complete published config.
func (l *LiveConfig) Snapshot() *Config {
	return l.v.Load().(*Config)
}

// Replace publishes a new config. c must not be mutated after this call.
func (l *LiveConfig) Replace(c *Config) {
	if c == nil {
		l.v.Store(&Config{})
		return
	}
	l.v.Store(c)
}
