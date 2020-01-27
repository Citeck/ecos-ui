export const statusesKeys = {
  ALL: 'all',
  FILE_ADDED: 'file-added',
  MULTI_FILES_ADDED: 'multi-files-added',
  NEED_ADD_FILES: 'need-add-files',
  CAN_ADD_FILES: 'can-add-files'
};

export const typesStatuses = {
  [statusesKeys.ALL]: 'Все статусы',
  [statusesKeys.FILE_ADDED]: 'Добавлен файл',
  [statusesKeys.MULTI_FILES_ADDED]: 'Добавлено несколько файлов',
  [statusesKeys.NEED_ADD_FILES]: 'Необходимо добавить файлы',
  [statusesKeys.CAN_ADD_FILES]: 'Можно добавить файлы'
};

export const typeStatusesByFields = Object.keys(typesStatuses).map(key => ({
  key,
  value: typesStatuses[key]
}));

export const tooltips = {
  SETTINGS: 'Настроить типы и колонки'
};

export const tableFields = {
  ALL: [
    {
      name: 'name',
      label: 'Тип'
    },
    {
      name: 'loadedBy',
      label: 'Загрузил'
    },
    {
      name: 'modified',
      label: 'Обновлено'
    },
    {
      name: 'count',
      label: 'Количество файлов'
    }
  ],
  DEFAULT: [
    {
      name: 'name',
      label: 'Название'
    },
    {
      name: 'loadedBy',
      label: 'Загрузил'
    },
    {
      name: 'modified',
      label: 'Обновлено'
    }
  ]
};
