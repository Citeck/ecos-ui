# Journal loading during column sorting

COREDEV-636: sorting an empty journal must keep the column headers in place and show the regular blur loader, just like Refresh. This applies both to the first sort click and to reversing its direction.

`JournalsDashletGrid` uses `loadingGrid` for primary table data. A skeleton is appropriate only while both rows and visible columns are unresolved. An empty `grid.data` alone is insufficient: a loaded journal can have zero matching records, including the default date-filtered time tracking journal. Once visible columns exist, the table has headers and enough geometry for the overlay loader.

The skeleton condition therefore requires empty rows **and** empty visible columns. Widget journals continue to use their dashlet's loading indicator. Sort defaults and query construction are unchanged.

Regression coverage: `JournalsDashletGrid/__tests__/loading.test.js` exercises both sort directions on empty and populated tables, header identity during reload, the transition from initial skeleton to known columns, and widget indicator ownership. The empty-table and column-resolution cases fail against the original condition.
