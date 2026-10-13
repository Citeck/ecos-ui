# Activity type descriptors

Activity list records expose the type as `{ id, displayName, parentType }`.
The activity type selector exposes the parent identifier as `type` instead.

`getCommentForWeb` preserves the record descriptor and fills its editor-facing
`type` from `parentType` when no explicit `type` is supplied. Consumers rendering
an activity continue to use `parentType`; editing and saving use `type`.

For planned calls, emails and meetings, `ActivitiesApi.update` sends `topic`,
`activityDate`, duration, responsible person and participants. The normalized
descriptor enables the same save branch for newly selected and existing activities.

The regression coverage in `src/dto/__tests__/activities.test.js` connects a
Records-shaped descriptor to `ActivitiesApi.update`, checks the saved attributes
and reloads the fixture. It also checks that the input descriptor is unchanged,
explicit editor types are preserved, and comment/assignment identifiers remain intact.

When editing an existing activity, the widget preserves its stored participants,
including an intentionally empty list. Workspace participant defaults apply only
when creating a new activity. The widget regression test checks both paths.
