const core = require('@actions/core');
const github = require('@actions/github');
const graphqlApi = require('./graphql');
const {getIssueAssociedCards, addIssueToProjectColumn, updateProjectCardColumn} = require('./queries')

exports.issuesWorkflow = async function (owner, repo, columnId) {
    const marker = core.getInput('marker');
    const {body, nodeId, html_url} = github.context.payload.issue;

    if ((body.indexOf(marker) === -1)) {
        console.log("Issue doesn't have a maker!");
        return;
    }

    const checkIfIssueIsAssociated = await getIssueAssociedCards(html_url);
    if (checkIfIssueIsAssociated.length === 0) {
        const results = await addIssueToProjectColumn(columnId, nodeId);
        console.log(`The card was successfully created in ${projectName} project!`);
        return;
    }

    projectCard = checkIfIssueIsAssociated.filter(card => card.project.name === projectName);

    if (!projectCard[0]) {
        console.log(`The card not found in ${projectName} project!`);
        return;
    }

    const results = await updateProjectCardColumn(projectCard[0].id, columnId);
}
