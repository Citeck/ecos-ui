export default function() {
  return {
    components: [
      {
        type: 'tabs',
        key: 'tabs',
        components: [
          {
            label: 'View',
            key: 'view',
            weight: 0,
            components: [
              {
                label: 'Use negative indents',
                labelPosition: 'left-left',
                type: 'checkbox',
                input: true,
                key: 'useNegativeIndents',
                defaultValue: true
              }
            ]
          }
        ]
      }
    ]
  };
}
