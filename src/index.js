const core = require('@actions/core');
const github = require('@actions/github');
const graphqlApi = require('./graphql');

const projectOwner = {
    "repo": "repository",
    "org": "organization",
    "user": "user",
}

async function run() {
    try {
        core.startGroup('Checking Inputs and Initializing... ');
        const projectName = core.getInput('project', {required: true});
        const projectColumn = core.getInput('column', {required: true});
        const marker = core.getInput('marker');
        const githubToken = core.getInput('github_token');
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const projectType = core.getInput('type');
        const {body, nodeId, html_url} = github.context.payload.issue;

        graphqlApi.init(githubToken);

        let projects = [];
        switch (projectType) {
            case "repo":
                projects = await getRepositoryProjects(owner, repo, projectName);
                break;
            case "org":
                projects = await getOrganizationProjects(owner, projectName);
                break;
            case "user":
                projects = await getUserProjects(owner, projectName);
                break;
        }

        if (!projects[0] || projects[0].name !== projectName) {
            console.log(`Project not found! Check if project with ${projectName} exists!`);
            return;
        }

        const {columns: {nodes: columns}} = projects[0];
        const projectColumns = columns.filter(column => column.name === projectColumn);
        if (!projectColumns[0]) {
            console.log(`The ${projectColumn} not found in ${projectName} project!`);
            return;
        }

        if ((body.indexOf(marker) === -1)) {
            console.log("Issue doesn't have a maker!");
            return;
        }

        const checkIfIssueIsAssociated = await getIssueAssociedCards(html_url);
        if (checkIfIssueIsAssociated.length === 0) {
            const results = await addIssueToProjectColumn(projectColumns[0].id, nodeId);
            console.log(`The card was successfully created in ${projectName} project!`);
            return;
        }

        projectCard = checkIfIssueIsAssociated.filter(card => card.project.name === projectName);

        if (!projectCard[0]) {
            console.log(`The card not found in ${projectName} project!`);
            return;
        }

        const results = await updateProjectCardColumn(projectCard[0].id, projectColumns[0].id);

    } catch (e) {
        console.log(e);
        core.setFailed(e.message);
    }
}


async function getRepositoryProjects(owner, repo, projectName) {
    const {repository: {projects: {nodes: projects}}} = await graphqlApi.query(
        `query ($owner: String!, $name: String!, $projectName: String!) {
            repository(owner: $owner, name: $name) {
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
            name: repo,
            projectName: projectName
        });

    return projects;
};

async function getOrganizationProjects(owner, projectName) {
    const {repository: {projects: {nodes: projects}}} = await graphqlApi.query(
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
};

async function getUserProjects(owner, projectName) {
    const {repository: {projects: {nodes: projects}}} = await graphqlApi.query(
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
};

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
};

async function addIssueToProjectColumn(columnId, issueId) {
    const result = await graphqlApi.query(
        `mutation ($columnId: ID!, $issueId: ID!) {
            addProjectCard(input: {projectColumnId: $columnId, contentId: $issueId}) {
                clientMutationId
            }
        }`, {
            columnId: columnId,
            issueId: issueId
        });

    return result;
};

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
};


run();

