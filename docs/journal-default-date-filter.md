# Default date intervals

Journal `defaultFilters` uses server predicates. Store a date interval as `eq` with a slash-separated
range, for example `{ t: 'eq', att: 'startDate', val: '-P1M/$NOW' }` for the last month through now.
The relative expression is evaluated when a query runs, rather than becoming a fixed date at build time.

`ParserPredicate.getDefaultPredicates` presents these defaults as the UI `time-interval` operator
for DATE/DATETIME columns. This selects the interval editor; query conversion turns the operator
back into `eq`. Single dates, non-date fields and other operators retain their behavior.
Do not persist the UI-only `time-interval` operator in a journal artifact.

Default filters initialize standard journal settings. Users can change or remove them; saved
presets retain their own filters. A default is not an enforced limit on all journal queries.
