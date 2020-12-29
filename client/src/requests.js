import { getAccessToken, isLoggedIn } from './auth';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';
import gql from 'graphql-tag';

const endpointURL = 'http://localhost:9000/graphql';

// AuthLink allows us to prepare the httpRequest e.g. setting the auth header.
// Functions as a custom ApolloLink instance
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
  // ApolloLink.from allows you to setup multiple links by adding them to
  // an array which combines them together
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  // cache requires a new instance of InMemoryCache other implemtations
  // are possible such as local storage or asyncStorage with React Native
  // cache allows requested data to be stored locally to avoid unnecessary requests
  cache: new InMemoryCache(),
});

// Fragments are used to define a group of fields we want to reuse in multiple places.
const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

// Moved all queries to top level to be able to access it from any function
const jobQuery = gql`
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

const companyQuery = gql`
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

// Here we use a fragment to define the query in order to write DRY code.
// Example for syntax review
const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      # fragment spread syntax
      ...JobDetail
    }
  }
  # Fragment definition necessary to use a fragment in a function
  ${jobDetailFragment}
`;

export async function createJob(input) {
  const {
    data: { job },
  } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    // the update function allows to write data directly to the cache
    // in this case we want the createJob function to directly write the
    // data coming from the mutation to the cache, thus removing the
    // need for a new call to the server
    // update: (cache, mutationResult) => {
    update: (cache, { data }) => {
      // console.log('mutation result:', mutationResult);
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });
  return job;
}

export async function loadCompany(id) {
  const {
    data: { company },
  } = await client.query({ query: companyQuery, variables: { id } });
  return company;
}

// ApolloClient edited function
export async function loadJobs() {
  // gql is a tag function, which effectively parses the string into an object
  // that represents the GQL query
  const query = gql`
    query jobsQuery {
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
    // It's not always good to cache things in memory depending on the situation in case of the job
    // board its undesirable because we want jobs to appear as they are created. For this
    // we can pass the fetchPolicy in the query object
  } = await client.query({ query, fetchPolicy: 'no-cache' });
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
