import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';

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
          },
          {
            label: 'Conditional',
            key: 'conditional',
            weight: 40,
            components: BaseEditConditional
          },
          {
            label: 'Logic',
            key: 'logic',
            weight: 50,
            components: BaseEditLogic
          }
        ]
      }
    ]
  };
}
