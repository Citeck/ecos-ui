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

`formId` must be a string. Both a local ID such as `contract-details` and a full
reference such as `uiserv/form@contract-details` are accepted. Numbers, booleans,
arrays and objects show a validation error without opening another form.
An omitted, null or empty-string value retains default form selection.
This includes an empty YAML `formId:` key, which parses as null; action
configuration interpolation preserves that value.

Workspace forms require their explicit system-ID prefix, for example
`<wsSysId>:contract-details` or `uiserv/form@<wsSysId>:contract-details`.
Use the form's local ID from the Forms journal, including that prefix; the
workspace's display name or workspace record ID is not a substitute for its
system ID. An unqualified ID selects a global form, without an implicit lookup
in the current workspace.

Set this property in the action's JSON configuration in the Actions journal or
in its action artifact. The selected form edits the action's record (or
`config.recordId` when overridden); choosing a form does not change the target.
Without `formId`, record-based form selection and the specialized dashboard
editor retain their existing behavior. With `formId`, a dashboard uses the
configured record form. Task-mode editing also accepts this setting and keeps
its assignment panel.

The custom form does not require the record to have a default form. Its
existence is checked instead of the record's default form, and the usual write
permission check still runs. Only an explicit `false` from `_notExists?bool`
confirms that the form exists. A missing form or failed lookup shows an error
and completes the action with `false`, including task mode; no default form is
silently substituted. Each custom-form availability check fetches a fresh value,
so retrying after a transport failure does not reuse the cached failed lookup.

Both modal-container and ordinary form rendering receive the selected form ID.
Existing save/cancel callbacks, attributes and cache resets are preserved.

The implementation is in `EditAction.jsx` and `EcosFormUtils.editRecord`.
Regression tests cover default/custom selection, a record without a default
form, invalid IDs, missing/unavailable custom forms, retry after a real Records
load failure, task/dashboard routes, action completion and save/cancel.
