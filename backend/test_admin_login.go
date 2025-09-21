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
	fmt.Println("🔐 Testing admin login and GraphQL queries...")

	// Step 1: Login as admin
	loginData := map[string]interface{}{
		"query": `
			mutation LoginUser($email: String!, $password: String!) {
				loginUser(email: $email, password: $password) {
					token
					user {
						id
						email
						username
						role
					}
				}
			}
		`,
		"variables": map[string]string{
			"email":    "admin@filevault.com",
			"password": "admin123",
		},
	}

	loginJSON, _ := json.Marshal(loginData)

	resp, err := http.Post("http://localhost:8080/query", "application/json", bytes.NewBuffer(loginJSON))
	if err != nil {
		fmt.Printf("❌ Failed to connect to server: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Login response: %s\n", string(body))

	// Parse the response to get the token
	var loginResponse map[string]interface{}
	json.Unmarshal(body, &loginResponse)

	if data, ok := loginResponse["data"].(map[string]interface{}); ok {
		if loginUser, ok := data["loginUser"].(map[string]interface{}); ok {
			if token, ok := loginUser["token"].(string); ok {
				fmt.Printf("✅ Login successful! Token: %s...\n", token[:20])

				// Step 2: Test admin stats query with token
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
				req.Header.Set("Authorization", "Bearer "+token)

				client := &http.Client{Timeout: 10 * time.Second}
				resp, err = client.Do(req)
				if err != nil {
					fmt.Printf("❌ GraphQL request failed: %v\n", err)
					return
				}
				defer resp.Body.Close()

				body, _ = io.ReadAll(resp.Body)
				fmt.Printf("Admin stats response: %s\n", string(body))

			} else {
				fmt.Println("❌ No token in login response")
			}
		} else {
			fmt.Println("❌ No loginUser in response data")
		}
	} else {
		fmt.Println("❌ No data in login response")
		if errors, ok := loginResponse["errors"]; ok {
			fmt.Printf("Errors: %v\n", errors)
		}
	}
}
