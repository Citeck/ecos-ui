import baseEditForm from '../../override/base/Base.form';
import TextFieldEditConditional from './editForm/TextField.edit.conditional';
import TextFieldEditDisplay from './editForm/TextField.edit.display';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: TextFieldEditDisplay
      },
      {
        key: 'conditional',
        components: TextFieldEditConditional
      }
    ],
    ...extend
  );
}
