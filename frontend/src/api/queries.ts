import { gql } from '@apollo/client';

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        email
        username
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($email: String!, $username: String!, $password: String!) {
    registerUser(email: $email, username: $username, password: $password) {
      token
      user {
        id
        email
        username
        role
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      username
      role
      createdAt
      updatedAt
    }
  }
`;

export const FILES_QUERY = gql`
  query Files($limit: Int, $offset: Int) {
    files(limit: $limit, offset: $offset) {
      id
      filename
      originalName
      mimeType
      size
      hash
      s3Key
      uploaderId
      folderId
      uploader {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_FILES_QUERY = gql`
  query SearchFiles($searchTerm: String!, $limit: Int, $offset: Int) {
    searchFiles(searchTerm: $searchTerm, limit: $limit, offset: $offset) {
      id
      filename
      originalName
      mimeType
      size
      hash
      uploaderId
      folderId
      uploader {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// UPLOAD_FILE mutation removed - will be rebuilt later

export const DELETE_FILE = gql`
  mutation DeleteFile($id: ID!) {
    deleteFile(id: $id)
  }
`;

export const GET_QUOTA = gql`
  query GetQuota {
    fileStats {
      totalFiles
      uniqueFiles
      totalSize
      filesByMimeType {
        mimeType
        count
      }
    }
  }
`;

// Folder queries and mutations
export const GET_FOLDERS = gql`
  query GetFolders {
    folders {
      id
      name
      path
      fileCount
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_FOLDER = gql`
  mutation CreateFolder($name: String!, $parentId: ID) {
    createFolder(name: $name, parentId: $parentId) {
      id
      name
      path
      fileCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_FOLDER = gql`
  mutation UpdateFolder($id: ID!, $name: String!) {
    updateFolder(id: $id, name: $name) {
      id
      name
      path
      fileCount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($id: ID!) {
    deleteFolder(id: $id)
  }
`;

// Query to get files by folder
export const GET_FILES_BY_FOLDER = gql`
  query GetFilesByFolder($folderId: ID!, $limit: Int, $offset: Int) {
    filesByFolder(folderId: $folderId, limit: $limit, offset: $offset) {
      id
      filename
      originalName
      mimeType
      size
      hash
      uploaderId
      folderId
      uploader {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_FILE_SHARES = gql`
  query GetMyFileShares($limit: Int, $offset: Int) {
    myFileShares(limit: $limit, offset: $offset) {
      id
      fileId
      shareToken
      shareUrl
      isActive
      expiresAt
      downloadCount
      maxDownloads
      createdAt
      file {
        id
        originalName
        mimeType
        size
      }
    }
  }
`;

export const GET_FILE_SHARE_STATS = gql`
  query GetFileShareStats($shareId: ID!) {
    fileShareStats(shareId: $shareId) {
      downloadCount
      recentDownloads {
        id
        ipAddress
        userAgent
        downloadedAt
      }
    }
  }
`;

// Admin queries
export const GET_ADMIN_STATS = gql`
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
`;

export const GET_ADMIN_USERS = gql`
  query GetAdminUsers($limit: Int, $offset: Int) {
    adminUsers(limit: $limit, offset: $offset) {
      userId
      username
      email
      totalFiles
      storageUsed
      lastLogin
      createdAt
      isActive
    }
  }
`;

export const GET_SYSTEM_HEALTH = gql`
  query GetSystemHealth {
    adminSystemHealth {
      databaseStatus
      storageStatus
      uptime
      memoryUsage
      diskUsage
      lastBackup
    }
  }
`;




