# Move Issues to Project Column

> Create GitHub Project cards with issue webhook event

This action allows you to use any of the [issue](https://help.github.com/en/articles/events-that-trigger-workflows#issues-event-issues) webhook events to create project cards. For example when an `issue` is `opened` create a card in the project column.

```ymlname: Move new issues into Project Boards
on:
  issues:
    types: [ opened ]
jobs:
  move-issue-to-repository-project-column:
    name: Move issues to repository project column
    runs-on: ubuntu-latest
    steps:
      - name: Move issue to 'To do' column if body has a mark 'issue:todo'
        uses: fojia/action-move-issues-to-column@master
        with:
          project: 'Actions Project'
          column: 'To do'
          issue: ${{ toJson(github.event.issue) }}
          owner: 'fojia'
          repo: 'action-move-issues-to-column'
          type: 'repo'
          github_token: ${{ secrets.GITHUB_TOKEN }}
          marker: 'issue:todo'
  move-issue-to-organization-project-column:
    name: Move issues to organization project column
    runs-on: ubuntu-latest
    steps:
      - name: Move issue to 'To do' column if body has a mark 'issue:todo'
        uses: fojia/action-move-issues-to-column@master
        with:
          project: 'Organization Project'
          column: 'To do'
          issue: ${{ toJson(github.event.issue) }}
          owner: 'fojia'
          type: 'org'
          github_token: ${{ secrets.GA_ACCESS_TOKEN}}
          marker: 'issue:todo'
  move-issue-to-user-project-column:
    name: Move issues to user project column
    runs-on: ubuntu-latest
    steps:
      - name: Move issue to 'To do' column if body has a mark 'issue:todo'
        uses: fojia/action-move-issues-to-column@master
        with:
          project: 'User Project'
          column: 'To do'
          issue: ${{ toJson(github.event.issue) }}
          owner: 'fojia'
          type: 'user'
          github_token: ${{ secrets.GA_ACCESS_TOKEN}}
          marker: 'issue:todo'
```
## Workflow options

| Inputs         | Description                                               | Values                         |
|----------------|-----------------------------------------------------------|--------------------------------|
| `on`           | When the automation is ran                                | `issues`                       |
| `types`        | The types of event that will trigger a workflow run.      | `opened`                       |
| `project`      | The name of the project                                   | `Action Project`               |
| `column`       | The column to create the card to                          | `To do`                        |
| `github_token` | The personal access token                                 | `${{ secrets.GITHUB_TOKEN }}`  |
| `owner`        | The Project owner                                         | `fojia`                        |
| `repo`         | The Project repository (if project inside repository)     | `action-move-issues-to-column` |
| `type`         | Type for project repository, user or organization project | `repo`, `user`, `org`          |

## Personal access token

Most of the time [`GITHUB_TOKEN`](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token) will work without problem. But if this not public project and repository you need to set a personal access token. Follow the instructions below to create access token. 

1. Create a personal access token
    1. [Public repository and repository project](https://github.com/settings/tokens/new?scopes=repo&description=GHPROJECT_TOKEN)
    1. [Private repository or private project](https://github.com/settings/tokens/new?scopes=repo&description=GHPROJECT_TOKEN)
    1. [Organisation project board or organisation repository](https://github.com/settings/tokens/new?scopes=repo,write:org&description=GHPROJECT_TOKEN)

1. [Add a secret](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) `GA_ACCESS_TOKEN` with the personal access token.
1. Update the `github_token` in the workflow `.yml`  to reference your new token name:
```yaml
github_token: ${{ secrets.GA_ACCESS_TOKEN }}
```