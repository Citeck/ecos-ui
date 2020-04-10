import baseEditForm from 'formiojs/components/base/Base.form';

import TaskOutcomeEditDisplay from './editForm/TaskOutcome.edit.display';

export default function(...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: TaskOutcomeEditDisplay
      }
    ],
    ...extend
  );
}
