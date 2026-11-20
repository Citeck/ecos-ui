# Required Boolean answers

For an ordinary checkbox, both `true` and `false` satisfy `validate.required`.
`null` and `undefined` are missing answers. This is the default behavior and needs
no extra form flag. An unselected radio checkbox retains its selection semantics.
A form requiring explicit confirmation must use a separate true-only validation rule.

The two-state control still defaults to `false` and can normalize missing/null input
to `false`. Use the existing three-state control when the interaction must preserve
an unanswered state. Defaults, value access and click behavior are unchanged.

Boolean answers are also nonempty for calculated-value overrides and view rendering.
The matching frontend source must be delivered for existing forms to gain this behavior.
`Checkbox.required.test.js` covers required dispatch, native clicks, explicit true-only
validation, radio selection, optional/disabled handling and adjacent value behavior.
