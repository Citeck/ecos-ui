# Custom form for the edit action (COREDEV-623)

An action with `type: edit` can select its form with `config.formId`, using the
same form identifier setting as `create` and `open-submit-form`:

```yaml
id: edit-contract-details
type: edit
name:
  ru: Редактировать договор
config:
  formId: contract-details
```

Both a local ID such as `contract-details` and a full reference such as
`uiserv/form@contract-details` are accepted.

Set this property in the action's JSON configuration in the Actions journal or
in its action artifact. The selected form edits the action's record (or
`config.recordId` when overridden); choosing a form does not change the target.
Without `formId`, record-based form selection and the specialized dashboard
editor retain their existing behavior. With `formId`, a dashboard uses the
configured record form. Task-mode editing also accepts this setting and keeps
its assignment panel.

The custom form does not require the record to have a default form. Its
existence is checked instead of the record's default form, and the usual write
permission check still runs. A missing form or failed form lookup uses the
existing unavailable-form notification/fallback; no default form is silently
substituted. Both modal-container and ordinary form rendering receive the
selected form ID. Existing save/cancel callbacks, attributes and cache resets
are preserved.

The implementation is in `EditAction.jsx` and `EcosFormUtils.editRecord`.
Regression tests cover default/custom selection, a record without a default
form, missing/unavailable custom forms, task/dashboard routes, and save/cancel.

Tracker access was unavailable during implementation because the API session
expired and the browser connector failed. The behavior above follows the user's
explicit request and the existing actions' `config.formId` convention.

Verification: 108 tests across 14 action/form suites passed; the production build
completed on Node 20. Browser verification with real action/form components and
isolated Records API responses opened the configured form on a record without
a default form, saved an edit, then cancelled an unsaved edit. No browser errors
were recorded. Screenshot and logs: Solution `.tmp/coredev-623/`.

Live verification (2026-10-09): the same production build was served separately
against the existing localhost backend, without API mocks or changing the main
UI/runtime. A temporary action stored in uiserv used `config.formId: custom-edit`.
The real resolved-form endpoint returned `uiserv/rform@custom-edit`, the custom
form opened, an email edit was saved to the temporary model record and confirmed
by an independent Records API read, and cancelling another edit preserved the
saved value. Screenshot: Solution `.tmp/coredev-623/live/local-id-form.png`.
All temporary records/action/form were removed and their absence verified; the
separate UI server was stopped. Evidence: `.tmp/coredev-623/live/result.json` and
`cleanup.json`.
