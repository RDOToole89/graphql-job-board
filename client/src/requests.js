import { getAccessToken, isLoggedIn } from './auth';
import { ApolloClient, HttpLink, InMemoryCache } from 'apollo-boost';
import gql from 'graphql-tag';

const endpointURL = 'http://localhost:9000/graphql';

// Minimum setup to run ApolloClient
const client = new ApolloClient({
  // link requires HttpLink and the endpoint adress
  link: new HttpLink({ uri: endpointURL }),
  // cache requires a new instance of InMemoryCache other implemtations
  // are possible such as local storage or asyncStorage with React Native
  // cache allows requested data to be stored locally to avoid unnecessary requests
  cache: new InMemoryCache(),
});

async function graphqlRequest(query, variables = {}) {
  const request = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  };
  if (isLoggedIn()) {
    request.headers['authorization'] = 'Bearer ' + getAccessToken();
  }

  const response = await fetch(endpointURL, request);

  const responseBody = await response.json();
  if (responseBody.errors) {
    const message = responseBody.errors.map((error) => error.message).join('\n');
    throw new Error(message);
  }
  return responseBody.data;
}

export async function createJob(input) {
  const mutation = `mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input)
    {
      id
      title
      company {
        id
        name
      }
    }
  }`;

  const { job } = await graphqlRequest(mutation, { input });
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

// export async function loadCompany(id) {
//   const query = `query CompanyQuery($id: ID!) {
//     company(id:$id) {
//       id
//       name
//       description
//       jobs {
//         id
//         title
//       }
//     }
//   }`;
//   const { company } = await graphqlRequest(query, { id });
//   return company;
// }

// export async function loadJobs() {
//   const query = `{
//     jobs {
//       id
//       title
//       company {
//         id
//         name
//       }
//     }
//   }`;

//   const { jobs } = await graphqlRequest(query, {});

//   return jobs;
// }

// export async function loadJob(id) {
//   const query = `query JobQuery($id: ID!){
//     job(id:$id) {
//       id
//       title
//       company {
//         id
//         name
//       }
//       description
//     }
// }`;
//   const { job } = await graphqlRequest(query, { id });
//   return job;
// }

// export async function loadJob(id) {
//   const response = await fetch(endpointURL, {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       query: `query JobQuery($id: ID!){
//                 job(id:$id) {
//                   id
//                   title
//                   company {
//                     id
//                     name
//                   }
//                   description
//                 }
//             }`,
//       variables: { id },
//     }),
//   });

//   const responseBody = await response.json();
//   return responseBody.data.job;
// }

// export async function loadJobs() {
//   const response = await fetch(endpointURL, {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       query: `{
//         jobs {
//           id
//           title
//           company {
//             id
//             name
//           }
//         }
//       }`,
//     }),
//   });

//   const responseBody = await response.json();
//   console.log('BODY', responseBody.data);
//   return responseBody.data.jobs;
// }
