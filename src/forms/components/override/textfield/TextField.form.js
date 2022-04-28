import baseEditForm from '../../override/base/Base.form';
import TextEditConditional from './editForm/TextField.edit.conditional';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'conditional',
        components: TextEditConditional
      }
    ],
    ...extend
  );
}
