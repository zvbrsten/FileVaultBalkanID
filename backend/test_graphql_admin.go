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
	// First, login as admin to get a token
	loginData := map[string]string{
		"email":    "admin@filevault.com",
		"password": "admin123", // Assuming default admin password
	}

	loginJSON, _ := json.Marshal(loginData)

	// Try to login
	resp, err := http.Post("http://localhost:8080/query", "application/json", bytes.NewBuffer(loginJSON))
	if err != nil {
		fmt.Printf("❌ Failed to connect to server: %v\n", err)
		fmt.Println("Make sure the backend server is running on port 8080")
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Login response: %s\n", string(body))

	// For now, let's test the admin stats query directly
	// We'll need to get a proper token first
	fmt.Println("\n🔍 Testing GraphQL admin queries...")

	// Test admin stats query
	adminStatsQuery := map[string]interface{}{
		"query": `
			query GetAdminStats {
				adminStats {
					totalUsers
					totalFiles
					totalStorage
					uniqueFiles
					duplicateFiles
					storageEfficiency
					activeUsers
					newUsersToday
					deduplicationStats {
						totalFileRecords
						uniqueFileHashes
						duplicateRecords
						storageSaved
						storageSavedPercent
						costSavingsUSD
					}
				}
			}
		`,
	}

	queryJSON, _ := json.Marshal(adminStatsQuery)

	req, _ := http.NewRequest("POST", "http://localhost:8080/query", bytes.NewBuffer(queryJSON))
	req.Header.Set("Content-Type", "application/json")
	// Note: We need a proper auth token here

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err = client.Do(req)
	if err != nil {
		fmt.Printf("❌ GraphQL request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ = io.ReadAll(resp.Body)
	fmt.Printf("Admin stats response: %s\n", string(body))
}
