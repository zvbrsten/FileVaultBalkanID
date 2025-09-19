package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	fmt.Println("Testing file share creation...")

	// First authenticate
	token, err := authenticate()
	if err != nil {
		fmt.Printf("❌ Authentication failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Authentication successful\n")

	// Use a known file ID (you can replace this with an actual file ID from your system)
	fileID := "e84e6d88-d4b7-4ca2-8e88-1c89e4aed35f" // From previous test

	// Test create file share
	query := `
		mutation CreateFileShare($fileId: ID!) {
			createFileShare(fileId: $fileId) {
				id
				shareToken
				shareUrl
				isActive
				downloadCount
				createdAt
			}
		}
	`

	requestData := map[string]interface{}{
		"query": query,
		"variables": map[string]string{
			"fileId": fileID,
		},
	}

	jsonData, _ := json.Marshal(requestData)
	fmt.Printf("Sending request: %s\n", string(jsonData))

	req, err := http.NewRequest("POST", "http://localhost:8080/query", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Failed to create request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Response status: %s\n", resp.Status)
	fmt.Printf("Response body: %s\n", string(body))

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if errors, ok := result["errors"].([]interface{}); ok && len(errors) > 0 {
		fmt.Printf("❌ GraphQL errors: %v\n", errors)
		return
	}

	// Debug: print the full result
	fmt.Printf("Full result: %+v\n", result)

	if data, ok := result["data"].(map[string]interface{}); ok {
		if createFileShare, ok := data["createFileShare"].(map[string]interface{}); ok {
			fmt.Printf("✅ File share created successfully!\n")
			if shareToken, ok := createFileShare["shareToken"].(string); ok {
				fmt.Printf("   Share Token: %s\n", shareToken)
			}
			if shareURL, ok := createFileShare["shareUrl"].(string); ok {
				fmt.Printf("   Share URL: %s\n", shareURL)
			}
		} else {
			fmt.Printf("❌ No createFileShare in response data\n")
		}
	} else {
		fmt.Printf("❌ No data in response\n")
	}
}

func authenticate() (string, error) {
	loginData := map[string]interface{}{
		"query": `
			mutation LoginUser($email: String!, $password: String!) {
				loginUser(email: $email, password: $password) {
					token
					user {
						id
						email
						username
					}
				}
			}
		`,
		"variables": map[string]string{
			"email":    "admin@filevault.com",
			"password": "admin123",
		},
	}

	jsonData, _ := json.Marshal(loginData)
	resp, err := http.Post("http://localhost:8080/query", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if errors, ok := result["errors"].([]interface{}); ok && len(errors) > 0 {
		return "", fmt.Errorf("GraphQL error: %v", errors[0])
	}

	if data, ok := result["data"].(map[string]interface{}); ok {
		if loginUser, ok := data["loginUser"].(map[string]interface{}); ok {
			if token, ok := loginUser["token"].(string); ok {
				return token, nil
			}
		}
	}

	return "", fmt.Errorf("failed to extract token from response")
}
