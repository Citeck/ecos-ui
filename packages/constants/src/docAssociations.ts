export const DIRECTIONS = {
  TARGET: 'TARGET',
  SOURCE: 'SOURCE',
  BOTH: 'BOTH',
  NULL: 'null'
};

export const baseColumnsConfig = {
  columns: [
    {
      attribute: '.disp',
      label: { ru: 'Заголовок', en: 'Name' },
      name: 'displayName',
      newFormatter: {
        type: 'link'
      }
    },
    {
      attribute: 'created',
      label: { ru: 'Дата создания', en: 'Create time' },
      name: 'created',
      type: 'datetime',
      newFormatter: {
        type: 'datetime'
      }
    }
  ]
};
