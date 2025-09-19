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
	fmt.Println("Testing FileVault File Sharing API...")

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

	// Test 2: Get User Files
	fmt.Println("\n2️⃣ Getting User Files...")
	filesQuery := `{
		"query": "query GetFiles($limit: Int, $offset: Int) { files(limit: $limit, offset: $offset) { id filename originalName mimeType size } }",
		"variables": {
			"limit": 5,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(filesQuery, token)
	if err != nil {
		fmt.Printf("❌ Get files failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Files Response: %s\n", resp)

	// Parse file ID from response
	var filesData map[string]interface{}
	json.Unmarshal([]byte(resp), &filesData)

	filesDataObj, ok := filesData["data"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No data in files response")
		return
	}

	files, ok := filesDataObj["files"].([]interface{})
	if !ok || len(files) == 0 {
		fmt.Println("❌ No files found")
		return
	}

	firstFile, ok := files[0].(map[string]interface{})
	if !ok {
		fmt.Println("❌ Invalid file data")
		return
	}

	fileID, ok := firstFile["id"].(string)
	if !ok {
		fmt.Println("❌ No file ID found")
		return
	}

	fmt.Printf("✅ Using File ID: %s\n", fileID)

	// Test 3: Create File Share
	fmt.Println("\n3️⃣ Creating File Share...")
	createShareQuery := `{
		"query": "mutation CreateFileShare($fileId: ID!, $expiresAt: String, $maxDownloads: Int) { createFileShare(fileId: $fileId, expiresAt: $expiresAt, maxDownloads: $maxDownloads) { id fileId shareToken shareUrl isActive expiresAt downloadCount maxDownloads createdAt file { id filename originalName mimeType size } } }",
		"variables": {
			"fileId": "` + fileID + `",
			"expiresAt": "` + time.Now().AddDate(0, 0, 7).Format("2006-01-02T15:04:05Z") + `",
			"maxDownloads": 10
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(createShareQuery, token)
	if err != nil {
		fmt.Printf("❌ Create file share failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Create Share Response: %s\n", resp)

	// Parse share token from response
	var shareData map[string]interface{}
	json.Unmarshal([]byte(resp), &shareData)

	shareDataObj, ok := shareData["data"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No data in share response")
		return
	}

	share, ok := shareDataObj["createFileShare"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No share data found")
		return
	}

	shareToken, ok := share["shareToken"].(string)
	if !ok {
		fmt.Println("❌ No share token found")
		return
	}

	fmt.Printf("✅ Share Token: %s...\n", shareToken[:20])

	// Test 4: Get My File Shares
	fmt.Println("\n4️⃣ Getting My File Shares...")
	mySharesQuery := `{
		"query": "query MyFileShares($limit: Int, $offset: Int) { myFileShares(limit: $limit, offset: $offset) { id fileId shareToken shareUrl isActive expiresAt downloadCount maxDownloads createdAt file { id filename originalName mimeType size } } }",
		"variables": {
			"limit": 10,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(mySharesQuery, token)
	if err != nil {
		fmt.Printf("❌ Get my file shares failed: %v\n", err)
		return
	}
	fmt.Printf("✅ My File Shares Response: %s\n", resp)

	// Test 5: Public File View (no authentication)
	fmt.Println("\n5️⃣ Testing Public File View...")
	resp, err = sendHTTPRequest("GET", baseURL+"/share/"+shareToken, "", "")
	if err != nil {
		fmt.Printf("❌ Public file view failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Public File View Response: %s\n", resp)

	// Test 6: Public File Download (no authentication)
	fmt.Println("\n6️⃣ Testing Public File Download...")
	resp, err = sendHTTPRequest("GET", baseURL+"/share/"+shareToken+"/download", "", "")
	if err != nil {
		fmt.Printf("❌ Public file download failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Public File Download Response: %s\n", resp)

	// Test 7: Get File Share Stats
	fmt.Println("\n7️⃣ Getting File Share Stats...")
	shareID, ok := share["id"].(string)
	if !ok {
		fmt.Println("❌ No share ID found")
		return
	}

	statsQuery := `{
		"query": "query FileShareStats($shareId: ID!) { fileShareStats(shareId: $shareId) { downloadCount recentDownloads { id ipAddress userAgent downloadedAt } } }",
		"variables": {
			"shareId": "` + shareID + `"
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(statsQuery, token)
	if err != nil {
		fmt.Printf("❌ Get file share stats failed: %v\n", err)
		return
	}
	fmt.Printf("✅ File Share Stats Response: %s\n", resp)

	fmt.Println("\n🎉 All file sharing tests completed successfully!")
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

func sendHTTPRequest(method, url, body, token string) (string, error) {
	var reqBody io.Reader
	if body != "" {
		reqBody = bytes.NewBufferString(body)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	return string(respBody), nil
}

