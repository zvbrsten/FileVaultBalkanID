package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "http://localhost:8080"

func main() {
	fmt.Println("Testing FileVault Search and Statistics API...")

	// Test 1: Login to get token
	fmt.Println("\n1️⃣ Logging in...")
	loginQuery := `{
		"query": "mutation LoginUser($email: String!, $password: String!) { loginUser(email: $email, password: $password) { token user { id email username role } } }",
		"variables": {
			"email": "test@example.com",
			"password": "password123"
		}
	}`

	resp, err := sendGraphQLRequest(loginQuery)
	if err != nil {
		fmt.Printf("❌ Login failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Login Response: %s\n", resp)

	// Parse token from response
	var loginData map[string]interface{}
	json.Unmarshal([]byte(resp), &loginData)

	data, ok := loginData["data"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No data in login response")
		return
	}

	loginUser, ok := data["loginUser"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No loginUser in response")
		return
	}

	token, ok := loginUser["token"].(string)
	if !ok {
		fmt.Println("❌ No token in response")
		return
	}

	fmt.Printf("✅ Received Token: %s...\n", token[:20])

	// Test 2: Get File Statistics
	fmt.Println("\n2️⃣ Getting File Statistics...")
	statsQuery := `{
		"query": "query FileStats { fileStats { totalFiles uniqueFiles totalSize filesByMimeType { mimeType count } } }"
	}`

	resp, err = sendGraphQLRequestWithAuth(statsQuery, token)
	if err != nil {
		fmt.Printf("❌ Get file stats failed: %v\n", err)
		return
	}
	fmt.Printf("✅ File Stats Response: %s\n", resp)

	// Test 3: Search Files
	fmt.Println("\n3️⃣ Searching Files...")
	searchQuery := `{
		"query": "query SearchFiles($searchTerm: String!, $limit: Int, $offset: Int) { searchFiles(searchTerm: $searchTerm, limit: $limit, offset: $offset) { id filename originalName mimeType size hash isDuplicate createdAt } }",
		"variables": {
			"searchTerm": "test",
			"limit": 5,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(searchQuery, token)
	if err != nil {
		fmt.Printf("❌ Search files failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Search Files Response: %s\n", resp)

	// Test 4: Get Files with Pagination
	fmt.Println("\n4️⃣ Getting Files with Pagination...")
	filesQuery := `{
		"query": "query GetFiles($limit: Int, $offset: Int) { files(limit: $limit, offset: $offset) { id filename originalName mimeType size hash isDuplicate createdAt } }",
		"variables": {
			"limit": 3,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(filesQuery, token)
	if err != nil {
		fmt.Printf("❌ Get files failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Files Response: %s\n", resp)

	// Test 5: Get User Info
	fmt.Println("\n5️⃣ Getting User Info...")
	meQuery := `{
		"query": "query Me { me { id email username role createdAt } }"
	}`

	resp, err = sendGraphQLRequestWithAuth(meQuery, token)
	if err != nil {
		fmt.Printf("❌ Get user info failed: %v\n", err)
		return
	}
	fmt.Printf("✅ User Info Response: %s\n", resp)

	fmt.Println("\n🎉 All search and statistics tests completed successfully!")
}

func sendGraphQLRequest(query string) (string, error) {
	return sendGraphQLRequestWithAuth(query, "")
}

func sendGraphQLRequestWithAuth(query string, token string) (string, error) {
	req, err := http.NewRequest("POST", baseURL+"/query", bytes.NewBufferString(query))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	return string(body), nil
}



