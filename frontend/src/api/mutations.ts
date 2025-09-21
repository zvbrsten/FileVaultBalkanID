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

export const UPLOAD_FILE = gql`
  mutation UploadFile($file: Upload!, $folderId: ID) {
    uploadFile(file: $file, folderId: $folderId) {
      id
      filename
      originalName
      mimeType
      size
      hash
      isDuplicate
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

export const DELETE_FILE = gql`
  mutation DeleteFile($id: ID!) {
    deleteFile(id: $id)
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

export const CREATE_FILE_SHARE = gql`
  mutation CreateFileShare($fileId: ID!, $expiresAt: String, $maxDownloads: Int) {
    createFileShare(fileId: $fileId, expiresAt: $expiresAt, maxDownloads: $maxDownloads) {
      id
      fileId
      shareToken
      shareUrl
      isActive
      expiresAt
      downloadCount
      maxDownloads
      createdAt
    }
  }
`;

export const UPDATE_FILE_SHARE = gql`
  mutation UpdateFileShare($id: ID!, $isActive: Boolean, $expiresAt: String, $maxDownloads: Int) {
    updateFileShare(id: $id, isActive: $isActive, expiresAt: $expiresAt, maxDownloads: $maxDownloads) {
      id
      fileId
      shareToken
      shareUrl
      isActive
      expiresAt
      downloadCount
      maxDownloads
      createdAt
    }
  }
`;

export const DELETE_FILE_SHARE = gql`
  mutation DeleteFileShare($id: ID!) {
    deleteFileShare(id: $id)
  }
`;
