package services

import (
	"bytes"
	"fmt"
)

// MimeValidationService handles MIME type validation
type MimeValidationService struct {
	// Common file signatures (magic numbers)
	fileSignatures map[string][]byte
}

// NewMimeValidationService creates a new MIME validation service
func NewMimeValidationService() *MimeValidationService {
	return &MimeValidationService{
		fileSignatures: map[string][]byte{
			// Images
			"image/jpeg": {0xFF, 0xD8, 0xFF},
			"image/png":  {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
			"image/gif":  {0x47, 0x49, 0x46, 0x38},
			"image/webp": {0x52, 0x49, 0x46, 0x46}, // RIFF header, need to check for WEBP
			"image/bmp":  {0x42, 0x4D},
			"image/tiff": {0x49, 0x49, 0x2A, 0x00}, // Little-endian TIFF

			// Documents
			"application/pdf":    {0x25, 0x50, 0x44, 0x46},                         // %PDF
			"application/msword": {0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}, // OLE2/CFB
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {0x50, 0x4B, 0x03, 0x04}, // ZIP-based
			"application/vnd.ms-excel": {0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}, // OLE2/CFB
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         {0x50, 0x4B, 0x03, 0x04},                         // ZIP-based
			"application/vnd.ms-powerpoint":                                             {0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}, // OLE2/CFB
			"application/vnd.openxmlformats-officedocument.presentationml.presentation": {0x50, 0x4B, 0x03, 0x04},                         // ZIP-based

			// Archives
			"application/zip":              {0x50, 0x4B, 0x03, 0x04},
			"application/x-rar-compressed": {0x52, 0x61, 0x72, 0x20, 0x1A, 0x07, 0x00}, // RAR v1.5+
			"application/x-7z-compressed":  {0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C},
			"application/gzip":             {0x1F, 0x8B},
			"application/x-tar":            {0x75, 0x73, 0x74, 0x61, 0x72}, // ustar

			// Audio
			"audio/mpeg": {0xFF, 0xFB},             // MP3
			"audio/wav":  {0x52, 0x49, 0x46, 0x46}, // RIFF header
			"audio/ogg":  {0x4F, 0x67, 0x67, 0x53}, // OggS
			"audio/flac": {0x66, 0x4C, 0x61, 0x43}, // fLaC

			// Video
			"video/mp4":       {0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70}, // MP4
			"video/avi":       {0x52, 0x49, 0x46, 0x46},                         // RIFF header
			"video/webm":      {0x1A, 0x45, 0xDF, 0xA3},                         // WebM
			"video/quicktime": {0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70}, // QuickTime

			// Text files
			"text/plain":       {},                                               // No specific signature, will be detected by content
			"text/html":        {0x3C, 0x68, 0x74, 0x6D, 0x6C},                   // <html
			"text/css":         {0x40, 0x69, 0x6D, 0x70, 0x6F, 0x72, 0x74},       // @import
			"text/javascript":  {0x66, 0x75, 0x6E, 0x63, 0x74, 0x69, 0x6F, 0x6E}, // function
			"application/json": {0x7B},                                           // {
			"application/xml":  {0x3C, 0x3F, 0x78, 0x6D, 0x6C},                   // <?xml
		},
	}
}

// ValidateMimeType validates that the file content matches the declared MIME type
func (s *MimeValidationService) ValidateMimeType(fileContent []byte, declaredMimeType string) error {
	if len(fileContent) == 0 {
		return fmt.Errorf("file is empty")
	}

	// Get the expected signature for the declared MIME type
	expectedSignature, exists := s.fileSignatures[declaredMimeType]
	if !exists {
		// If we don't have a signature for this MIME type, we can't validate it
		// This is acceptable for some file types
		return nil
	}

	// Special cases that need additional validation
	switch declaredMimeType {
	case "image/webp":
		return s.validateWebP(fileContent)
	case "audio/wav":
		return s.validateWAV(fileContent)
	case "video/avi":
		return s.validateAVI(fileContent)
	case "text/plain":
		return s.validateTextFile(fileContent)
	case "application/json":
		return s.validateJSON(fileContent)
	case "application/xml":
		return s.validateXML(fileContent)
	}

	// Check if the file starts with the expected signature
	if len(expectedSignature) > 0 && len(fileContent) >= len(expectedSignature) {
		if !bytes.HasPrefix(fileContent, expectedSignature) {
			return fmt.Errorf("file content does not match declared MIME type %s", declaredMimeType)
		}
	}

	return nil
}

// validateWebP validates WebP format (RIFF with WEBP chunk)
func (s *MimeValidationService) validateWebP(fileContent []byte) error {
	if len(fileContent) < 12 {
		return fmt.Errorf("file too short to be a valid WebP")
	}

	// Check RIFF header
	if !bytes.HasPrefix(fileContent, []byte{0x52, 0x49, 0x46, 0x46}) {
		return fmt.Errorf("not a valid RIFF file")
	}

	// Check for WEBP chunk at offset 8
	webpChunk := fileContent[8:12]
	if !bytes.Equal(webpChunk, []byte{0x57, 0x45, 0x42, 0x50}) { // "WEBP"
		return fmt.Errorf("not a valid WebP file")
	}

	return nil
}

// validateWAV validates WAV format (RIFF with WAVE chunk)
func (s *MimeValidationService) validateWAV(fileContent []byte) error {
	if len(fileContent) < 12 {
		return fmt.Errorf("file too short to be a valid WAV")
	}

	// Check RIFF header
	if !bytes.HasPrefix(fileContent, []byte{0x52, 0x49, 0x46, 0x46}) {
		return fmt.Errorf("not a valid RIFF file")
	}

	// Check for WAVE chunk at offset 8
	waveChunk := fileContent[8:12]
	if !bytes.Equal(waveChunk, []byte{0x57, 0x41, 0x56, 0x45}) { // "WAVE"
		return fmt.Errorf("not a valid WAV file")
	}

	return nil
}

// validateAVI validates AVI format (RIFF with AVI chunk)
func (s *MimeValidationService) validateAVI(fileContent []byte) error {
	if len(fileContent) < 12 {
		return fmt.Errorf("file too short to be a valid AVI")
	}

	// Check RIFF header
	if !bytes.HasPrefix(fileContent, []byte{0x52, 0x49, 0x46, 0x46}) {
		return fmt.Errorf("not a valid RIFF file")
	}

	// Check for AVI chunk at offset 8
	aviChunk := fileContent[8:12]
	if !bytes.Equal(aviChunk, []byte{0x41, 0x56, 0x49, 0x20}) { // "AVI "
		return fmt.Errorf("not a valid AVI file")
	}

	return nil
}

// validateTextFile validates text files by checking for null bytes
func (s *MimeValidationService) validateTextFile(fileContent []byte) error {
	// Check for null bytes (binary files contain null bytes)
	if bytes.Contains(fileContent, []byte{0x00}) {
		return fmt.Errorf("file contains binary data, not a valid text file")
	}

	// Check for valid UTF-8 encoding
	if !s.isValidUTF8(fileContent) {
		return fmt.Errorf("file is not valid UTF-8 text")
	}

	return nil
}

// validateJSON validates JSON format
func (s *MimeValidationService) validateJSON(fileContent []byte) error {
	// Remove leading/trailing whitespace
	content := bytes.TrimSpace(fileContent)

	// Check if it starts with { or [
	if len(content) == 0 || (content[0] != '{' && content[0] != '[') {
		return fmt.Errorf("not a valid JSON file")
	}

	// Basic JSON structure validation
	braceCount := 0
	bracketCount := 0
	inString := false
	escaped := false

	for _, b := range content {
		if escaped {
			escaped = false
			continue
		}

		if b == '\\' {
			escaped = true
			continue
		}

		if b == '"' {
			inString = !inString
			continue
		}

		if !inString {
			switch b {
			case '{':
				braceCount++
			case '}':
				braceCount--
			case '[':
				bracketCount++
			case ']':
				bracketCount--
			}
		}
	}

	if braceCount != 0 || bracketCount != 0 {
		return fmt.Errorf("invalid JSON structure")
	}

	return nil
}

// validateXML validates XML format
func (s *MimeValidationService) validateXML(fileContent []byte) error {
	content := bytes.TrimSpace(fileContent)

	// Check for XML declaration or root element
	if !bytes.HasPrefix(content, []byte{0x3C, 0x3F, 0x78, 0x6D, 0x6C}) && // <?xml
		!bytes.HasPrefix(content, []byte{0x3C}) { // <
		return fmt.Errorf("not a valid XML file")
	}

	// Basic XML structure validation
	openTags := 0
	inComment := false
	inCDATA := false

	for i := 0; i < len(content); i++ {
		if inComment {
			if bytes.HasPrefix(content[i:], []byte{0x2D, 0x2D, 0x3E}) { // -->
				inComment = false
				i += 2
			}
			continue
		}

		if inCDATA {
			if bytes.HasPrefix(content[i:], []byte{0x5D, 0x5D, 0x3E}) { // ]]>
				inCDATA = false
				i += 2
			}
			continue
		}

		if bytes.HasPrefix(content[i:], []byte{0x3C, 0x21, 0x2D, 0x2D}) { // <!--
			inComment = true
			i += 3
			continue
		}

		if bytes.HasPrefix(content[i:], []byte{0x3C, 0x21, 0x5B, 0x43, 0x44, 0x41, 0x54, 0x41, 0x5B}) { // <![CDATA[
			inCDATA = true
			i += 8
			continue
		}

		if content[i] == '<' {
			if i+1 < len(content) && content[i+1] == '/' {
				openTags--
			} else if i+1 < len(content) && content[i+1] != '!' {
				openTags++
			}
		}
	}

	if openTags != 0 {
		return fmt.Errorf("invalid XML structure")
	}

	return nil
}

// isValidUTF8 checks if the byte slice contains valid UTF-8
func (s *MimeValidationService) isValidUTF8(data []byte) bool {
	for len(data) > 0 {
		r, size := s.decodeRune(data)
		if r == 0xFFFD && size == 1 {
			return false
		}
		data = data[size:]
	}
	return true
}

// decodeRune decodes the first UTF-8 rune in data
func (s *MimeValidationService) decodeRune(data []byte) (rune, int) {
	if len(data) == 0 {
		return 0xFFFD, 0
	}

	if data[0] < 0x80 {
		return rune(data[0]), 1
	}

	if len(data) < 2 {
		return 0xFFFD, 1
	}

	if data[0]&0xE0 == 0xC0 {
		if data[1]&0xC0 != 0x80 {
			return 0xFFFD, 1
		}
		return rune(data[0]&0x1F)<<6 | rune(data[1]&0x3F), 2
	}

	if len(data) < 3 {
		return 0xFFFD, 1
	}

	if data[0]&0xF0 == 0xE0 {
		if data[1]&0xC0 != 0x80 || data[2]&0xC0 != 0x80 {
			return 0xFFFD, 1
		}
		return rune(data[0]&0x0F)<<12 | rune(data[1]&0x3F)<<6 | rune(data[2]&0x3F), 3
	}

	if len(data) < 4 {
		return 0xFFFD, 1
	}

	if data[0]&0xF8 == 0xF0 {
		if data[1]&0xC0 != 0x80 || data[2]&0xC0 != 0x80 || data[3]&0xC0 != 0x80 {
			return 0xFFFD, 1
		}
		return rune(data[0]&0x07)<<18 | rune(data[1]&0x3F)<<12 | rune(data[2]&0x3F)<<6 | rune(data[3]&0x3F), 4
	}

	return 0xFFFD, 1
}

// DetectMimeTypeFromContent attempts to detect MIME type from file content
func (s *MimeValidationService) DetectMimeTypeFromContent(fileContent []byte) string {
	if len(fileContent) == 0 {
		return "application/octet-stream"
	}

	// Check each signature
	for mimeType, signature := range s.fileSignatures {
		if len(signature) > 0 && len(fileContent) >= len(signature) {
			if bytes.HasPrefix(fileContent, signature) {
				// Additional validation for special cases
				switch mimeType {
				case "image/webp":
					if s.validateWebP(fileContent) == nil {
						return mimeType
					}
				case "audio/wav":
					if s.validateWAV(fileContent) == nil {
						return mimeType
					}
				case "video/avi":
					if s.validateAVI(fileContent) == nil {
						return mimeType
					}
				default:
					return mimeType
				}
			}
		}
	}

	// Check for text files
	if s.validateTextFile(fileContent) == nil {
		return "text/plain"
	}

	// Default to binary
	return "application/octet-stream"
}
