const core = require('@actions/core');
const github = require('@actions/github');
const {
    findAllNestedPullRequestsIssues,
    lastPullRequests,
    updateProjectCardColumn,
    getIssueAssociedCards,
    addIssueToProjectColumn
} = require('./queries')

exports.prWorkflow = async function (owner, repo, columnId, projectName) {
    const destBranch = core.getInput('branch');
    
    if (destBranch !== github.context.payload.pull_request.base.ref || github.context.payload.pull_request.base.merged === false) {
        return;
    }

    const lastPRs = await lastPullRequests(owner, repo, destBranch);
    if (!lastPRs[0]) {
        console.log(`Not found any PRs for ${destBranch}`);
        return;
    }
    if (!lastPRs[0].cursor) {
        console.log(`Not found cursor for PR!`);
        return;
    }
    const cursor = lastPRs.length === 1 ? false : lastPRs[0].cursor;
    let issues = (await findAllNestedPullRequestsIssues(owner, repo, destBranch, cursor)).filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
    
    if (issues.length === 0) {
        console.log(`Not found any issues related to current PR and all children PRs`);
        return;
    }
    for (let i = 0; i < issues.length; i++) {
        let issue = issues[i];
        const checkIfIssueIsAssociated = await getIssueAssociedCards(issue.url);
        if (checkIfIssueIsAssociated.length === 0) {
            await addIssueToProjectColumn(columnId, issue.id);
            continue;
        }

        let projectCard = checkIfIssueIsAssociated.filter(card => card.project.name === projectName);
        if (!projectCard[0]) {
            continue;
        }

        await updateProjectCardColumn(projectCard[0].id, columnId);
    }
}
