import { getAccessToken, isLoggedIn } from './auth';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';
import gql from 'graphql-tag';

const endpointURL = 'http://localhost:9000/graphql';

// AuthLink allows us to prepare the httpRequest e.g. setting the auth header.
const authLink = new ApolloLink((operation, forward) => {
  // This function will run if the user is logged in and add the auth to
  // operation object with the setContext fuction
  if (isLoggedIn()) {
    // request.headers['authorization'] = 'Bearer ' + getAccessToken();
    operation.setContext({
      headers: {
        authorization: 'Bearer ' + getAccessToken(),
      },
    });
  }
  return forward(operation);
});

// Minimum setup to run ApolloClient
const client = new ApolloClient({
  // link requires HttpLink and the endpoint adress
  // ApolloLink.from allows you to setup multiple links
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  // cache requires a new instance of InMemoryCache other implemtations
  // are possible such as local storage or asyncStorage with React Native
  // cache allows requested data to be stored locally to avoid unnecessary requests
  cache: new InMemoryCache(),
});

export async function createJob(input) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput) {
      job: createJob(input: $input) {
        id
        title
        company {
          id
          name
        }
      }
    }
  `;

  const {
    data: { job },
  } = await client.mutate({ mutation, variables: { input } });
  return job;
}

export async function loadCompany(id) {
  const query = gql`
    query CompanyQuery($id: ID!) {
      company(id: $id) {
        id
        name
        description
        jobs {
          id
          title
        }
      }
    }
  `;
  const {
    data: { company },
  } = await client.query({ query, variables: { id } });
  return company;
}

// ApolloClient edited function
export async function loadJobs() {
  // gql is a tag function, which effectively parses the string into an object
  // that represents the GQL query
  const query = gql`
    {
      jobs {
        id
        title
        company {
          id
          name
        }
      }
    }
  `;

  // the client query function returns a promise containing an object with the GQL response
  const {
    // nested destructuring
    data: { jobs },
  } = await client.query({ query });
  return jobs;
}

export async function loadJob(id) {
  const query = gql`
    query JobQuery($id: ID!) {
      job(id: $id) {
        id
        title
        company {
          id
          name
        }
        description
      }
    }
  `;

  const {
    data: { job },
  } = await client.query({ query, variables: { id } });
  return job;
}
