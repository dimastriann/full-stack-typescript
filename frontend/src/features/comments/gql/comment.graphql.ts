import { gql } from '@apollo/client';

export const CREATE_COMMENT = gql`
  mutation CreateComment($createCommentInput: CreateCommentInput!) {
    createComment(createCommentInput: $createCommentInput) {
      id
      content
      createdAt
      user {
        id
        name
      }
      parentId
    }
  }
`;
