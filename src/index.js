const core = require('@actions/core');
const github = require('@actions/github');
const graphqlApi = require('./graphql');
const {prWorkflow} = require('./pr-workflow');
const {issuesWorkflow} = require('./issues-workflow');
const {getRepositoryProjects, getOrganizationProjects, getUserProjects} = require('./queries')

async function run() {
    try {
        const githubToken = core.getInput('github_token');
        const projectName = core.getInput('project', {required: true});
        const projectColumn = core.getInput('column', {required: true});
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const projectType = core.getInput('type');
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
        
        const {eventName} = github.context;
        if (eventName === 'pull_request') {
            prWorkflow(owner, repo, projectColumns[0].id);
        } else {
            issuesWorkflow(owner, repo, projectColumns[0].id);
        }

    } catch (e) {
        console.log(e);
        core.setFailed(e.message);
    }
}

run();

