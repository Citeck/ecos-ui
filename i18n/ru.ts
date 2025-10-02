const ru = {
  //calendar
  calendar: {
    monthFull: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],

    dayFull: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],

    dayShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    hours: 'Часы',
    minutes: 'Минуты',
    done: 'Готово',
    clear: 'Очистить',
    today: 'Сегодня',
    am: ['дп', 'ДП'],
    pm: ['пп', 'ПП'],

    weekStart: 1,
    timeFormat: 24
  },

  //core
  core: {
    ok: 'ОК',
    cancel: 'Отмена'
  },

  //formats
  formats: {
    dateFormat: '%d.%m.%Y',
    timeFormat: '%H:%i'
  },

  gantt: {
    // Header / sidebar
    'Task name': 'Название задачи',
    'Start date': 'Дата начала',
    Duration: 'Продолжительность',
    Task: 'Задача',
    Milestone: 'Веха',
    'Summary task': 'Этап',

    // Sidebar
    Save: 'Сохранить',
    Delete: 'Удалить',
    Name: 'Название',
    Description: 'Описание',
    'Select type': 'Выбрать тип',
    Type: 'Тип',
    'End date': 'Дата окончания',
    Progress: 'Прогресс',
    Predecessors: 'Предшественники',
    Successors: 'Преемники',
    'Add task name': 'Добавить название задачи',
    'Add description': 'Добавить описание',
    'Select link type': 'Выбрать тип связи',
    'End-to-start': 'Окончание-начало',
    'Start-to-start': 'Начало-начало',
    'End-to-end': 'Окончание-окончание',
    'Start-to-end': 'Начало-окончание',

    // Context menu / toolbar
    Add: 'Добавить',
    'Child task': 'Дочерняя задача',
    'Task above': 'Задача выше',
    'Task below': 'Задача ниже',
    'Convert to': 'Преобразовать в',
    Edit: 'Редактировать',
    Cut: 'Вырезать',
    Copy: 'Копировать',
    Paste: 'Вставить',
    Move: 'Переместить',
    Up: 'Вверх',
    Down: 'Вниз',
    Indent: 'Увеличить отступ',
    Outdent: 'Уменьшить отступ',
    'Split task': 'Разделить задачу',

    // Toolbar
    'New task': 'Новая задача',
    'Move up': 'Переместить вверх',
    'Move down': 'Переместить вниз'
  }
};

export default ru;
