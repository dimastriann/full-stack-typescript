import { gql } from '@apollo/client';

export const UPLOAD_FILE = gql`
  mutation UploadFile(
    $file: Upload!
    $relationId: Int!
    $relationType: String!
  ) {
    uploadFile(
      file: $file
      relationId: $relationId
      relationType: $relationType
    ) {
      id
      filename
      path
      mimeType
      size
    }
  }
`;

export const REMOVE_ATTACHMENT = gql`
  mutation RemoveAttachment($id: Int!) {
    removeAttachment(id: $id) {
      id
    }
  }
`;
