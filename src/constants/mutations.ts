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

// AddPointsInput = {
//   "input": {
//     "userAddress": "",
//     "points": ""
//   }
// }
