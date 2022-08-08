export default [
  {
    type: 'textfield',
    input: true,
    key: 'modalTitle',
    label: 'Modal title (optional)',
    weight: 13,
    tooltip: `There are several options for specifying a title:
  - Simple text;
  - Component label (selector:items) that will pass through the localization function;
  - Template text like "Select: {{component.label}}", where the content between 
    curly braces is the path to the value of the current component from <bold>this</bold>;
  - Localization key from the form.

All of these options go through the localization function.
    `
  }
];
