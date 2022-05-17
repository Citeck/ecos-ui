import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';

import { t } from '../../../../../helpers/export/util';

const simpleConditional = BaseEditConditional.find(item => item.key === 'simple-conditional');

if (simpleConditional && simpleConditional.components) {
  const conditionalWhen = simpleConditional.components.find(item => item.key === 'conditional.when');

  if (conditionalWhen) {
    conditionalWhen.data = {
      custom: `
      utils.eachComponent(instance.root.editForm.components, function(component, path) {
        if (component.key !== data.key) {
          values.push({
            label: component.labelByLocale || utils.getTextByLocale(component.label) || component.label || component.key,
            value: component.key
          });
        }
      });
    `
    };
  }
}

const customConditional = BaseEditConditional.find(item => item.key === 'customConditionalPanel');

if (customConditional) {
  customConditional.components = [
    {
      type: 'htmlelement',
      tag: 'div',
      get content() {
        return t('form-constructor.html.htmlelement1');
      }
    },
    {
      type: 'panel',
      key: 'customConditional-js',
      label: 'JavaScript',
      collapsible: true,
      collapsed: false,
      components: [
        {
          type: 'textarea',
          key: 'customConditional',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        },
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement12');
          }
        }
      ]
    },
    {
      type: 'panel',
      key: 'customConditional-json',
      label: 'JSONLogic',
      collapsible: true,
      collapsed: true,
      components: [
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement18');
          }
        },
        {
          type: 'textarea',
          key: 'conditional.json',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        }
      ]
    }
  ];
}

export default BaseEditConditional;
