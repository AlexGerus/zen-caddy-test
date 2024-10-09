
import gql from 'graphql-tag';

export default gql`
  query AuthExchangeToken($data: AuthExchangeTokenInput!) {
    authExchangeToken(data: $data) {
      ...AuthSessionFields
    }
  }

  ${AuthSessionFields}
`;
