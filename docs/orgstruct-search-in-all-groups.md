# Orgstruct selection: search in all groups

The SelectOrgstruct control supports the boolean `isSearchInAllGroups` option
(default: `false`). The form builder exposes it as **Search in all groups** on the
control's custom settings tab, with English and Russian translations.

With the option enabled, a non-empty search searches groups and users without the
configured root group's `authorityGroupsFull` restriction. With no search text,
the control still lists members of its configured root group. Other authority
filters and permissions remain in effect. With the option disabled, search stays
within the configured root group.

This option is available in ecos-ui 2.30.2. The release ports COREDEV-566 commits
`2ffc15dc0` and `3abe89aa4`; it does not include the comment mention functionality
from the same feature branch. The API regression tests in
`src/api/__tests__/orgStruct.test.js` cover restricted search, unrestricted search,
and root-group browsing with the option enabled.
