import textFieldForm from 'formiojs/components/textfield/TextField.form';

import TextFieldEditData from './editForm/TextField.edit.data';

export default function(...extend) {
  return textFieldForm(
    [
      {
        key: 'data',
        components: TextFieldEditData
      }
    ],
    ...extend
  );
}
