export const typesStatuses = {
  ALL: 'Все статусы',
  FILE_ADDED: 'Добавлен файл',
  MULTI_FILES_ADDED: 'Добавлено несколько файлов',
  NEED_ADD_FILES: 'Необходимо добавить файлы',
  CAN_ADD_FILES: 'Можно добавить файлы'
};

export const typeStatusesByFields = Object.keys(typesStatuses).map(key => ({
  key,
  value: typesStatuses[key]
}));

export const tooltips = {
  SETTINGS: 'Настроить типы и колонки'
};
