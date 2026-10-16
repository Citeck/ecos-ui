# Action confirmation prefill

Confirmation dialogs resolve `confirm.formAttributes` templates from the current
record with a forced Records API load every time the action opens. This applies
to nested objects and arrays as well as top-level fields. Explicit `action.formData`
continues to override matching prefilled fields.

This matters when an action sends work to another instance: the action may finish
before reverse synchronization updates the local record. Refreshing immediately
after execution can therefore cache the old values. Reopening the confirmation
must read the server again instead of reusing those values (COREDEV-567 observers).
The server remains authoritative; a dialog opened before synchronization finishes
still shows the server's current state.

`replaceAttributeValues(data, record, forceReload = false)` retains cached reads
for existing callers. Confirmation prefill opts into `true`; it does not clear
unrelated record attributes or change record mutations.

Regression coverage uses the real Records cache and a simulated remote update:
`recordActions.test.js` reopens the same action after the update;
`recordUtilsReload.test.ts` also checks nested templates and the default cache behavior.
