const core = require('@actions/core');
const rest = require("@octokit/rest");
const auth_action = require("@octokit/auth-action");

async function run() {
    try {
        core.startGroup('Checking Inputs and Initializing... ');
        const projectName = core.getInput('project', {required: true});
        const projectColumn = core.getInput('column', {required: true});
        const issue = JSON.parse(core.getInput('issue'));
        const marker = core.getInput('marker');
        const githubToken = core.getInput('github_token');
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const projectType = core.getInput('type');
        core.info('Start Authentication...');
        core.info("Token: " + githubToken);
        const octokit = new rest.Octokit({
            auth: githubToken,
        });
        core.info("Done.");
        core.endGroup();
        core.startGroup("Find Project and Column");
        let projects = [];
        switch (projectType) {
            case "repo":
                projects = await octokit.request('GET /repos/{owner}/{repo}/projects', {
                    owner: owner,
                    repo: repo
                })
                break;
            case "org":
                projects = await octokit.request('GET /orgs/{org}/projects', {
                    org: owner
                })
                break;
            case "user":
                projects = await octokit.request('GET /users/{username}/projects', {
                    username: owner
                })
                break;
        }
        projects = projects.data || null;
        if (!Array.isArray(projects)) {
            console.log("Project not found!");
            return;
        }

        projects = projects.filter(project => project.name === projectName);
        if (!projects[0]) {
            console.log("Project not found!");
            return;
        }

        let projectColumns = await octokit.request('GET /projects/{project_id}/columns', {
            project_id: projects[0].id
        })
        projectColumns = projectColumns.data || null;
        if (!Array.isArray(projectColumns)) {
            console.log("Project doesn't have columns!");
            return;
        }
        projectColumns = projectColumns.filter(column => column.name === projectColumn);
        if (!projectColumns[0]) {
            console.log("Column not found in project!");
            return;
        }
        core.endGroup();
        core.startGroup("Checking Issue and Adding to Project Column");
        if (!issue || !issue.body) {
            console.log("Some issue data are missed! Please check input data.");
            return;
        }
        core.info("Checking if marker string exists in body issue.");
        if ((issue.body.indexOf(marker) !== -1)) {
            core.info("Add issue to Project Column.");
            await octokit.request('POST /projects/columns/{column_id}/cards', {
                column_id: projectColumns[0].id,
                content_id: issue.id,
                content_type: 'Issue'
            })
        }
        core.endGroup();
    } catch (e) {
        core.setFailed(e.message);
    }
}

run();