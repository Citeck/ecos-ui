import EditFormUtils from 'formiojs/components/base/editForm/utils';
import { t } from '../../../../../helpers/export/util';

EditFormUtils.logicVariablesTable = (additional = '') => {
  return {
    type: 'htmlelement',
    tag: 'div',
    /* eslint-disable prefer-template */
    get content() {
      return `
        <table class="table table-bordered table-condensed table-striped">
          ${additional}
          <tr>
            <th>form</th>
            <td>${t('form-constructor.table.form')}</td>
          </tr>
          <tr>
            <th>submission</th>
            <td>${t('form-constructor.table.submission')}</td>
          </tr>
          <tr>
            <th>data</th>
            <td>${t('form-constructor.table.data')}</td>
          </tr>
          <tr>
            <th>row</th>
            <td>${t('form-constructor.table.row')}</td>
          </tr>
          <tr>
            <th>component</th>
            <td>${t('form-constructor.table.component')}</td>
          </tr>
          <tr>
            <th>instance</th>
            <td>${t('form-constructor.table.instance')}</td>
          </tr>
          <tr>
            <th>value</th>
            <td>${t('form-constructor.table.value')}</td>
          </tr>
          <tr>
            <th>moment</th>
            <td>${t('form-constructor.table.moment')}</td>
          </tr>
          <tr>
            <th>_</th>
            <td>${t('form-constructor.table.lodash')}</td>
          </tr>
          <tr>
            <th>utils</th>
            <td>${t('form-constructor.table.utils')}</td>
          </tr>
          <tr>
            <th>util</th>
            <td>${t('form-constructor.table.util')}</td>
          </tr>
      </table><br/>`;
    }
    /* eslint-enable prefer-template */
  };
};

export default EditFormUtils;
