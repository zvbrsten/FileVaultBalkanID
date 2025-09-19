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
      isDuplicate
      uploaderId
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
      isDuplicate
      uploaderId
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







