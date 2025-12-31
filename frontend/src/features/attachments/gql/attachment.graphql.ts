import { gql } from '@apollo/client';

export const UPLOAD_FILE = gql`
  mutation UploadFile($file: Upload!, $relationId: Int!, $relationType: String!) {
    uploadFile(file: $file, relationId: $relationId, relationType: $relationType) {
      id
      filename
      path
      mimeType
      size
    }
  }
`;
