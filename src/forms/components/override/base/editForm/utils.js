import EditFormUtils from 'formiojs/components/base/editForm/utils';
import { t } from '../../../../../helpers/export/util';

EditFormUtils.logicVariablesTable = additional => {
  additional = additional || '';
  const test = `<div>${t('form-editor.remove-button')}</div>`;
  return {
    type: 'htmlelement',
    tag: 'div',
    /* eslint-disable prefer-template */
    content:
      test +
      '<table class="table table-bordered table-condensed table-striped">' +
      additional +
      '<tr><th>form</th><td>The complete form JSON object</td></tr>' +
      '<tr><th>submission</th><td>The complete submission object.</td></tr>' +
      '<tr><th>data</th><td>The complete submission data object.</td></tr>' +
      '<tr><th>row</th><td>Contextual "row" data, used within DataGrid, EditGrid, and Container components</td></tr>' +
      '<tr><th>component</th><td>The current component JSON</td></tr>' +
      '<tr><th>instance</th><td>The current component instance.</td></tr>' +
      '<tr><th>value</th><td>The current value of the component.</td></tr>' +
      '<tr><th>moment</th><td>The moment.js library for date manipulation.</td></tr>' +
      '<tr><th>_</th><td>An instance of <a href="https://lodash.com/docs/" target="_blank">Lodash</a>.</td></tr>' +
      '<tr><th>utils</th><td>An instance of the <a href="http://formio.github.io/formio.js/docs/identifiers.html#utils" target="_blank">FormioUtils</a> object.</td></tr>' +
      '<tr><th>util</th><td>An alias for "utils".</td></tr>' +
      '</table><br/>'
    /* eslint-enable prefer-template */
  };
};

export default EditFormUtils;
