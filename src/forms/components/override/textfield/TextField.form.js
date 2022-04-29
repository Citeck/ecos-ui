import FormIOTextFieldComponent from 'formiojs/components/textfield/TextField';
import TextFieldEditConditional from './editForm/TextField.edit.conditional';
import TextFieldEditDisplay from './editForm/TextField.edit.display';

export default function(...extend) {
  return FormIOTextFieldComponent(
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
