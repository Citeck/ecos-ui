import { DataTypes } from '../../../../../components/common/form/SelectOrgstruct/constants';

export default [
  {
    type: 'select',
    input: true,
    label: 'Data type',
    key: 'dataType',
    weight: 10,
    data: {
      values: [
        {
          value: DataTypes.NODE_REF,
          label: 'Node Ref'
        },
        {
          value: DataTypes.AUTHORITY,
          label: 'Authority'
        }
      ]
    },
    defaultValue: DataTypes.NODE_REF
  }
];
