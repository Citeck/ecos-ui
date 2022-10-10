import DataMapEditDisplay from 'formiojs/components/datamap/editForm/DataMap.edit.display';

import { replaceComponentConfig } from '../../../../utils';

replaceComponentConfig(DataMapEditDisplay, 'keyLabel', {
  type: 'mlText',
  label: {
    en: 'Label for Key column',
    ru: 'Метка для колонки «Ключ»'
  },
  tooltip: {
    en: "Provide a label text for Key column (otherwise 'Key' will be used)",
    ru: 'Укажите текст метки для столбца «Ключ» (в противном случае будет использоваться «Ключ»)'
  }
});

export default DataMapEditDisplay;
