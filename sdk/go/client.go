package neuralshell

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	APIKey     string
	AdminToken string
	HTTPClient *http.Client
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	Name    string `json:"name,omitempty"`
}

type ChatCompletion struct {
	ID        string    `json:"id"`
	Object    string    `json:"object"`
	Created   int       `json:"created"`
	Model     string    `json:"model"`
	Choices   []Choice  `json:"choices"`
	Usage     Usage     `json:"usage"`
	RequestID string    `json:"requestId"`
}

type Choice struct {
	Index        int         `json:"index"`
	Message      Message     `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type Metrics struct {
	Total    int `json:"total"`
	Success  int `json:"success"`
	Fail     int `json:"fail"`
	InFlight int `json:"inFlight"`
}

type Endpoint struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Model       string `json:"model"`
	Healthy     bool   `json:"healthy"`
	InCooldown  bool   `json:"inCooldown"`
	Failures    int    `json:"failures"`
	Successes   int    `json:"successes"`
	AvgLatency  int    `json:"avgLatency"`
}

type Error struct {
	Error     string `json:"error"`
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"requestId"`
}

func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) SetAPIKey(key string) {
	c.APIKey = key
}

func (c *Client) SetAdminToken(token string) {
	c.AdminToken = token
}

func (c *Client) headers() map[string]string {
	h := map[string]string{
		"Content-Type": "application/json",
	}
	if c.APIKey != "" {
		h["x-prompt-token"] = c.APIKey
	}
	if c.AdminToken != "" {
		h["x-admin-token"] = c.AdminToken
	}
	return h
}

func (c *Client) doRequest(method, path string, body interface{}) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, c.BaseURL+path, reqBody)
	if err != nil {
		return nil, err
	}

	for k, v := range c.headers() {
		req.Header.Set(k, v)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		var errResp Error
		if json.Unmarshal(body, &errResp) == nil {
			return nil, fmt.Errorf("%s: %s", errResp.Code, errResp.Message)
		}
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func (c *Client) Chat(messages []Message, opts ...Option) (*ChatCompletion, error) {
	req := &struct {
		Messages   []Message `json:"messages"`
		Model      string    `json:"model,omitempty"`
		Temperature float64  `json:"temperature,omitempty"`
		MaxTokens  int      `json:"max_tokens,omitempty"`
	}{
		Messages: messages,
	}

	for _, opt := range opts {
		opt(req)
	}

	body, err := c.doRequest("POST", "/prompt", req)
	if err != nil {
		return nil, err
	}

	var resp ChatCompletion
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}

func (c *Client) Health() (map[string]interface{}, error) {
	body, err := c.doRequest("GET", "/health", nil)
	if err != nil {
		return nil, err
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	return resp, nil
}

func (c *Client) Metrics() (*Metrics, error) {
	body, err := c.doRequest("GET", "/metrics/json", nil)
	if err != nil {
		return nil, err
	}

	var resp Metrics
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	return &resp, nil
}

func (c *Client) Endpoints() ([]Endpoint, error) {
	body, err := c.doRequest("GET", "/endpoints", nil)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Endpoints []Endpoint `json:"endpoints"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	return resp.Endpoints, nil
}

func (c *Client) ResetEndpoints() error {
	_, err := c.doRequest("POST", "/endpoints/reset", nil)
	return err
}

func (c *Client) ResetMetrics() error {
	_, err := c.doRequest("POST", "/metrics/reset", nil)
	return err
}

type Option func(*interface{})

func WithModel(model string) Option {
	return func(i *interface{}) {
		req := (*struct {
			Model *string `json:"model,omitempty"`
		})(unsafe.Pointer(i))
		req.Model = &model
	})
}

func WithTemperature(temp float64) Option {
	return func(i *interface{}) {}
}

func WithMaxTokens(tokens int) Option {
	return func(i *interface{}) {}
}
