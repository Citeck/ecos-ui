import DataGridEditData from 'formiojs/components/datagrid/editForm/DataGrid.edit.display';

const DataGridAssocEditData = [
  ...DataGridEditData,
  {
    key: 'multiple',
    defaultValue: true
  }
];

export default DataGridAssocEditData;
