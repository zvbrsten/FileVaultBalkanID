package graph

// Helper functions for extracting values from variables
func getStringPtr(variables map[string]interface{}, key string) *string {
	if val, ok := variables[key]; ok {
		if str, ok := val.(string); ok {
			return &str
		}
	}
	return nil
}

func getIntPtr(variables map[string]interface{}, key string) *int {
	if val, ok := variables[key]; ok {
		if i, ok := val.(int); ok {
			return &i
		}
		if f, ok := val.(float64); ok {
			i := int(f)
			return &i
		}
	}
	return nil
}

func getBoolPtr(variables map[string]interface{}, key string) *bool {
	if val, ok := variables[key]; ok {
		if b, ok := val.(bool); ok {
			return &b
		}
	}
	return nil
}

func getStringSlice(variables map[string]interface{}, key string) []string {
	if val, ok := variables[key]; ok {
		if slice, ok := val.([]interface{}); ok {
			result := make([]string, 0, len(slice))
			for _, item := range slice {
				if str, ok := item.(string); ok {
					result = append(result, str)
				}
			}
			return result
		}
	}
	return nil
}

func getString(variables map[string]interface{}, key string) string {
	if val, ok := variables[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getInt(variables map[string]interface{}, key string) *int {
	if val, ok := variables[key]; ok {
		if i, ok := val.(int); ok {
			return &i
		}
		if f, ok := val.(float64); ok {
			i := int(f)
			return &i
		}
	}
	return nil
}
