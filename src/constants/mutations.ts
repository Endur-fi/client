import { gql } from "@apollo/client";

export const UPDATE_USER_POINTS = gql`
  mutation Mutation($input: AddPointsInput!) {
    addPointsToUser(input: $input) {
      success
      message
      userAddress
      pointsAdded
      newTotalPoints
    }
  }
`;

export const SAVE_USER_EMAIL = gql`
  mutation Mutation($input: SaveEmailInput!) {
    saveEmail(input: $input) {
      success
      message
    }
  }
`;
