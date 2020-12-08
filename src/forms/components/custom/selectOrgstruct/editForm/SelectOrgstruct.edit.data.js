import { DataTypes } from '../../../../../components/common/form/SelectOrgstruct/constants';

export default [
  {
    type: 'select',
    input: true,
    label: 'Data type',
    key: 'dataType',
    weight: 10,
    data: {
      values: Object.values(DataTypes)
    },
    defaultValue: DataTypes.NODE_REF
  }
];
