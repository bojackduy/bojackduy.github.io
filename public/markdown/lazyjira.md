# [LazyJira](https://github.com/bojackduy/lazyjira)

A keyboard-first Jira workspace for the terminal, covering project timelines, sprint backlogs, issue lists, Scrum/Kanban boards, and rich issue inspection.

![LazyJira sprint board](/img/projects/lazyjira.png)

*LazyJira's sprint board — workflow columns, issue cards, and the inspector panel.*

## Design principle: safe remote writes

Changes are staged locally, shown as a readable plan or diff, and only sent to Jira after explicit confirmation. This keeps fast keyboard workflows from becoming risky workflows.

## Highlights

- Vim-style navigation across five primary project views
- Paginated loading for large boards and backlogs
- Markdown-to-Atlassian-Document-Format conversion
- Rich issue bodies, comments, and reviewable mutations

Built with TypeScript, Bun, SolidJS, OpenTUI, and the Jira REST API. Published as [`@bojackduy/lazyjira`](https://www.npmjs.com/package/@bojackduy/lazyjira), with more than 3,800 downloads by September 2026.
