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
	fmt.Println("Testing FileVault Admin API...")

	// Test 1: Login as admin to get token
	fmt.Println("\n1️⃣ Logging in as admin...")
	loginQuery := `{
		"query": "mutation LoginUser($email: String!, $password: String!) { loginUser(email: $email, password: $password) { token user { id email username role } } }",
		"variables": {
			"email": "admin@example.com",
			"password": "admin123"
		}
	}`

	resp, err := sendGraphQLRequest(loginQuery)
	if err != nil {
		fmt.Printf("❌ Admin login failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Admin Login Response: %s\n", resp)

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

	fmt.Printf("✅ Received Admin Token: %s...\n", token[:20])

	// Test 2: Get Admin Stats
	fmt.Println("\n2️⃣ Getting Admin Stats...")
	adminStatsQuery := `{
		"query": "query AdminStats { adminStats { totalUsers activeUsers totalFiles uniqueFiles totalStorage storageEfficiency totalShares activeShares totalDownloads recentActivity { id type username details createdAt } } }"
	}`

	resp, err = sendGraphQLRequestWithAuth(adminStatsQuery, token)
	if err != nil {
		fmt.Printf("❌ Get admin stats failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Admin Stats Response: %s\n", resp)

	// Test 3: Get System Health
	fmt.Println("\n3️⃣ Getting System Health...")
	healthQuery := `{
		"query": "query SystemHealth { systemHealth { databaseStatus storageStatus uptime memoryUsage cpuUsage diskUsage lastChecked } }"
	}`

	resp, err = sendGraphQLRequestWithAuth(healthQuery, token)
	if err != nil {
		fmt.Printf("❌ Get system health failed: %v\n", err)
		return
	}
	fmt.Printf("✅ System Health Response: %s\n", resp)

	// Test 4: Get All Users
	fmt.Println("\n4️⃣ Getting All Users...")
	allUsersQuery := `{
		"query": "query AllUsers($limit: Int, $offset: Int) { allUsers(limit: $limit, offset: $offset) { id email username role isActive createdAt lastLogin fileCount storageUsed } }",
		"variables": {
			"limit": 10,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(allUsersQuery, token)
	if err != nil {
		fmt.Printf("❌ Get all users failed: %v\n", err)
		return
	}
	fmt.Printf("✅ All Users Response: %s\n", resp)

	// Test 5: Get Recent Activity
	fmt.Println("\n5️⃣ Getting Recent Activity...")
	activityQuery := `{
		"query": "query RecentActivity($limit: Int) { recentActivity(limit: $limit) { id type username details createdAt } }",
		"variables": {
			"limit": 10
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(activityQuery, token)
	if err != nil {
		fmt.Printf("❌ Get recent activity failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Recent Activity Response: %s\n", resp)

	// Test 6: Get Storage Breakdown
	fmt.Println("\n6️⃣ Getting Storage Breakdown...")
	storageQuery := `{
		"query": "query StorageBreakdown { storageBreakdown }"
	}`

	resp, err = sendGraphQLRequestWithAuth(storageQuery, token)
	if err != nil {
		fmt.Printf("❌ Get storage breakdown failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Storage Breakdown Response: %s\n", resp)

	// Test 7: Get Top Files
	fmt.Println("\n7️⃣ Getting Top Files...")
	topFilesQuery := `{
		"query": "query TopFiles($limit: Int) { topFiles(limit: $limit) }",
		"variables": {
			"limit": 5
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(topFilesQuery, token)
	if err != nil {
		fmt.Printf("❌ Get top files failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Top Files Response: %s\n", resp)

	// Test 8: Get Admin Logs
	fmt.Println("\n8️⃣ Getting Admin Logs...")
	adminLogsQuery := `{
		"query": "query AdminLogs($limit: Int, $offset: Int) { adminLogs(limit: $limit, offset: $offset) { id adminId adminName action target details ipAddress userAgent createdAt } }",
		"variables": {
			"limit": 10,
			"offset": 0
		}
	}`

	resp, err = sendGraphQLRequestWithAuth(adminLogsQuery, token)
	if err != nil {
		fmt.Printf("❌ Get admin logs failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Admin Logs Response: %s\n", resp)

	// Test 9: Test HTTP Admin Endpoints
	fmt.Println("\n9️⃣ Testing HTTP Admin Endpoints...")

	// Get admin dashboard
	resp, err = sendHTTPRequest("GET", baseURL+"/api/admin/dashboard", "", token)
	if err != nil {
		fmt.Printf("❌ Get admin dashboard failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Admin Dashboard Response: %s\n", resp)

	// Get system stats
	resp, err = sendHTTPRequest("GET", baseURL+"/api/admin/stats", "", token)
	if err != nil {
		fmt.Printf("❌ Get system stats failed: %v\n", err)
		return
	}
	fmt.Printf("✅ System Stats Response: %s\n", resp)

	// Get system health
	resp, err = sendHTTPRequest("GET", baseURL+"/api/admin/health", "", token)
	if err != nil {
		fmt.Printf("❌ Get system health failed: %v\n", err)
		return
	}
	fmt.Printf("✅ System Health Response: %s\n", resp)

	// Test 10: Test Admin Actions (if we have a user to modify)
	fmt.Println("\n🔟 Testing Admin Actions...")

	// Get first user to test with
	allUsersData, err := sendGraphQLRequestWithAuth(allUsersQuery, token)
	if err != nil {
		fmt.Printf("❌ Failed to get users for testing: %v\n", err)
		return
	}

	var usersData map[string]interface{}
	json.Unmarshal([]byte(allUsersData), &usersData)

	usersDataObj, ok := usersData["data"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No data in users response")
		return
	}

	users, ok := usersDataObj["allUsers"].([]interface{})
	if !ok || len(users) == 0 {
		fmt.Println("❌ No users found for testing")
		return
	}

	firstUser, ok := users[0].(map[string]interface{})
	if !ok {
		fmt.Println("❌ Invalid user data")
		return
	}

	userID, ok := firstUser["id"].(string)
	if !ok {
		fmt.Println("❌ No user ID found")
		return
	}

	fmt.Printf("✅ Using User ID for testing: %s\n", userID)

	// Test cleanup expired data
	cleanupQuery := `{
		"query": "mutation CleanupExpiredData { cleanupExpiredData }"
	}`

	resp, err = sendGraphQLRequestWithAuth(cleanupQuery, token)
	if err != nil {
		fmt.Printf("❌ Cleanup expired data failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Cleanup Expired Data Response: %s\n", resp)

	fmt.Println("\n🎉 All admin tests completed successfully!")
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





