import baseEditForm from '../base/Base.form';

import HTMLEditDisplay from './editForm/HTML.edit.display';
import HTMLEditLogic from './editForm/HTML.edit.logic';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: HTMLEditDisplay
      },
      {
        key: 'logic',
        components: HTMLEditLogic
      }
    ],
    ...extend
  );
}
