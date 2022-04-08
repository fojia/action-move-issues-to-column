const core = require('@actions/core');
const github = require('@actions/github');
const {getIssueAssociedCards, addIssueToProjectColumn, updateProjectCardColumn} = require('./queries')

exports.issuesWorkflow = async function (owner, repo, columnId, projectName) {
    const marker = core.getInput('marker');
    const {body, node_id, html_url} = github.context.payload.issue;
    if ((body.indexOf(marker) === -1)) {
        console.log("Issue doesn't have a maker!");
        return;
    }

    const checkIfIssueIsAssociated = await getIssueAssociedCards(html_url);
    if (checkIfIssueIsAssociated.length === 0) {
        await addIssueToProjectColumn(columnId, node_id);
        console.log(`The card was successfully created in ${projectName} project!`);
        return;
    }

    let projectCard = checkIfIssueIsAssociated.filter(card => card.project.name === projectName);

    if (!projectCard[0]) {
        await addIssueToProjectColumn(columnId, node_id);
        console.log(`The card was successfully created in ${projectName} project!`);
        return;
    }

    await updateProjectCardColumn(projectCard[0].id, columnId);
    console.log(`The card was successfully updated in ${projectName} project!`);
}
