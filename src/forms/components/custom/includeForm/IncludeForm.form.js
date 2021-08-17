export default function() {
  return {
    components: [
      {
        label: {
          ru: 'HTML'
        },
        key: 'html',
        className: 'alert alert-info',
        content:
          "This component allows embed another form. The component doesn't include anything common settings. If there's a value, the component will be replased form fully.",
        refreshOnChange: false,
        refreshOn: [],
        type: 'htmlelement',
        input: false
      },
      {
        label: {
          ru: 'Select Form'
        },
        key: 'formRef',
        journalId: 'ecos-forms',
        refreshOn: [],
        type: 'selectJournal',
        input: true,
        queryData: '',
        validate: {
          required: true
        }
      }
    ]
  };
}
