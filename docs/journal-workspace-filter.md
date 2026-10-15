# Journal workspace selection

The `_workspace` association picker is a query scope selector, rather than a filter on a stored
association. `journalsDataLoader.getRecordsQuery` moves positive `_workspace` selections
(`contains`, `eq`, `in`, scalar or array) from conjunctive predicates into
`RecordsQuery.workspaces`, normalizing workspace references to local IDs.

A journal with an `_workspace` column still searches all accessible workspaces by default.
Without that column, the current workspace remains the default. Explicit widget workspace settings
retain priority: a picker selection narrows that scope by intersection. Multiple AND selections
are intersected too. An empty intersection adds an always-false predicate; an empty workspace list
alone would request all accessible workspaces.

Per the COREDEV-121 owner decision on 2026-10-15, workspace filtering supports AND selections only.
One-branch OR wrappers emitted by the header filter are transparent, just like AND wrappers.
Workspace leaves inside multi-branch OR/NOT groups are ignored and never promoted to query scope.
Other standalone workspace operators retain their previous predicate behavior; this scope selector
only translates positive selections. Other attributes and the remaining groups are preserved.
Processing happens before predicate optimization, so removing workspace leaves cannot promote a
previously ignored branch of a multi-branch OR into a scope selection.

The table, footer total and exports use the resulting Records query, including its `workspaces`
and any `predicate-with-data` payload. The scope retains standard backend behavior, including
nested workspace expansion and access checks. This is not an exact-workspace storage predicate.
When workspaces are disabled, the loader retains the previous predicate behavior.

Regression coverage: `service/__tests__/workspaceFilter.test.js` under
`src/components/journals/Journals`, plus `src/dto/__tests__/journals.totalSum.test.js`.
