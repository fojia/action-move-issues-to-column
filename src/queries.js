const graphqlApi = require('./graphql');

async function updateProjectCardColumn(cardId, columnId) {
    const result = await graphqlApi.query(
        `mutation updateProjectCard($cardId: ID!, $columnId: ID!) {
            moveProjectCard(input:{cardId: $cardId, columnId: $columnId}) {
                clientMutationId
            }
        }`, {
            columnId: columnId,
            cardId: cardId
        });

    return result;
}

async function lastPullRequests(owner, repo, destinationBranch) {
    const {repository: {pullRequests: {edges: pullRequests}}} = await graphqlApi.query(
        `query ($owner: String!, $name: String!, $branch: String!) {
            repository(owner: $owner, name: $name) {
                pullRequests(last: 2, baseRefName: $branch) {
                    edges {
                        node {
                            id
                            baseRefName
                            headRefName
                            number
                            state
                        }
                        cursor
                    }
                }
            }
        }`, {
            owner: owner,
            name: repo,
            branch: destinationBranch
        });
    return pullRequests;
}

const findAllNestedPullRequestsIssues = async (owner, repo, destinationBranch, endCursor) => {
    let issues = [];
    let pullRequests = await findAllNestedPullRequests(owner, repo, destinationBranch, endCursor);
    if (pullRequests.length) {
        for (let i = 0; i < pullRequests.length; i++) {
            let {closingIssuesReferences: {edges: refIssues}} = pullRequests[i].node;
            if (refIssues.length) {
                for (let j = 0; j < refIssues.length; j++) {
                    issues.push({id: refIssues[j].node.id, url: refIssues[j].node.url});
                }
            }
            let results = await findAllNestedPullRequestsIssues(owner, repo, pullRequests[i].node.headRefName, endCursor);
            return [...issues, ...results];
        }
    }

    return issues;
}


async function findAllNestedPullRequests(owner, repo, destinationBranch, endCursor) {
    const {repository: {pullRequests: {edges: pullRequests}}} = await graphqlApi.query(
        `query ($owner: String!, $name: String!, $branch: String!, ${endCursor === false ? `` : `$cursor: String!`}) {
          repository(owner: $owner, name: $name) {
            pullRequests(first: 100, baseRefName: $branch ${endCursor === false ? `` : `, after: $cursor`}) {
              edges {
                node {
                  id
                  baseRefName
                  headRefName
                  number
                  state
                  closingIssuesReferences(first: 100) {
                    edges {
                        node {
                            id
                            title
                            url
                          }
                       }
                    }
                }
              }
            }
          }
        }`, {
            owner: owner,
            name: repo,
            branch: destinationBranch,
            cursor: endCursor
        });

    return pullRequests;
}

async function getRepositoryProjects(owner, repo, projectName) {
    const {repository: {projects: {nodes: projects}}} = await graphqlApi.query(
        `query ($owner: String!, $name: String!, $projectName: String!) {
            repository(owner: $owner, name: $name) {
                projects(search: $projectName, last: 1, states: [OPEN]) {
                    nodes {
                        name
                        id
                            columns(first: 15) {
                                nodes {
                                    name,
                                    id
                                }
                            }
                    }
                }
            }
        }`, {
            owner: owner,
            name: repo,
            projectName: projectName
        });

    return projects;
}

async function getOrganizationProjects(owner, projectName) {
    const {organization: {projects: {nodes: projects}}} = await graphqlApi.query(
        `query ($owner: String!, $projectName: String!) {
            organization(login: $owner) {
                projects(search: $projectName, last: 1, states: [OPEN]) {
                    nodes {
                        name
                        id
                            columns(first: 10) {
                                nodes {
                                    name,
                                    id
                                }
                            }
                    }
                }
            }
        }`, {
            owner: owner,
            projectName: projectName
        });

    return projects;
}

async function getUserProjects(owner, projectName) {
    const {user: {projects: {nodes: projects}}} = await graphqlApi.query(
        `query ($owner: String!, $projectName: String!) {
            user(login: $owner) {
                projects(search: $projectName, last: 1, states: [OPEN]) {
                    nodes {
                        name
                        id
                            columns(first: 10) {
                                nodes {
                                    name,
                                    id
                                }
                            }
                    }
                }
            }
        }`, {
            owner: owner,
            projectName: projectName
        });

    return projects;
}

async function getIssueAssociedCards(url) {
    const {resource: {projectCards: {nodes: cards}}} = await graphqlApi.query(
        `query ($link: URI!) {
          resource(url: $link) {
            ... on Issue {
              projectCards {
                nodes {
                  id
                  isArchived
                  project {
                    name
                    id
                  }
                }
              }
            }
          }
        }`, {
            link: url,
        });

    return cards;
}

async function addIssueToProjectColumn(columnId, issueId) {
    return await graphqlApi.query(
        `mutation ($columnId: ID!, $issueId: ID!) {
            addProjectCard(input: {projectColumnId: $columnId, contentId: $issueId}) {
                clientMutationId
            }
        }`, {
            columnId: columnId,
            issueId: issueId
        });
}

module.exports = {
    updateProjectCardColumn: updateProjectCardColumn,
    lastPullRequests: lastPullRequests,
    findAllNestedPullRequestsIssues: findAllNestedPullRequestsIssues,
    findAllNestedPullRequests: findAllNestedPullRequests,
    addIssueToProjectColumn: addIssueToProjectColumn,
    getIssueAssociedCards: getIssueAssociedCards,
    getUserProjects: getUserProjects,
    getOrganizationProjects: getOrganizationProjects,
    getRepositoryProjects: getRepositoryProjects
}