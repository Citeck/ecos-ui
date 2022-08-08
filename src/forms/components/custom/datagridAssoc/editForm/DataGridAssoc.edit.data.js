import DataGridEditData from 'formiojs/components/datagrid/editForm/DataGrid.edit.display';

import { t } from '../../../../../helpers/export/util';

const DataGridAssocEditData = [
  ...DataGridEditData,
  {
    key: 'multiple',
    defaultValue: true
  }
];

const addAnotherPosition = DataGridAssocEditData.find(item => item.key === 'addAnotherPosition');

if (addAnotherPosition) {
  addAnotherPosition.data.values = [
    {
      get label() {
        return t('form-constructor.select.top');
      },
      value: 'top'
    },
    {
      get label() {
        return t('form-constructor.select.bottom');
      },
      value: 'bottom'
    },
    {
      get label() {
        return t('form-constructor.select.both');
      },
      value: 'both'
    }
  ];
}

const removePlacement = DataGridAssocEditData.find(item => item.key === 'removePlacement');

if (removePlacement) {
  removePlacement.data.values = [
    {
      get label() {
        return t('form-constructor.select.right-most-column');
      },
      value: 'col'
    },
    {
      get label() {
        return t('form-constructor.select.row-top-right');
      },
      value: 'corner'
    }
  ];
}

export default DataGridAssocEditData;
