const bpmnDesigner = {
  'bpmn-designer': {
    'add-category': 'Добавить категорию',
    'category-action': {
      access: 'Доступ',
      'add-subcategory': 'Добавить подкатегорию',
      'create-model': 'Создать модель',
      delete: 'Удалить',
      rename: 'Переименовать'
    },
    'create-bpm-dialog': {
      'close-btn': 'Закрыть',
      'failure-text': 'Чтобы создать модель, необходимо добавить хотя бы одну категорию',
      'failure-title': 'Создание модели бизнес процесса',
      title: 'Создание модели бизнес процесса'
    },
    'create-bpm-form': {
      author: 'Автор',
      'cancel-btn': 'Отмена',
      category: 'Выберите категорию',
      description: 'Описание (не обязательно)',
      owner: 'Владелец процесса',
      'process-key': 'Ключ бизнес-процесса',
      'process-key-placeholder': '',
      reviewers: 'Эксперт процесса',
      'submit-btn': 'Создать модель',
      title: 'Название модели',
      'title-placeholder': 'Например "Запрос справки"',
      'valid-from': 'Дата начала действия',
      'valid-to': 'Дата окончания действия'
    },
    'create-model': 'Создать модель',
    'create-model-card': {
      label: 'Создать'
    },
    'delete-category-dialog': {
      'cancel-btn': 'Отмена',
      'close-btn': 'Закрыть',
      'delete-btn': 'Удалить',
      'failure-text': 'Категория не пуста',
      'failure-title': 'Ошибка удаления категории',
      text: 'Вы действительно хотите удалить категорию?',
      title: 'Удаление категории'
    },
    'import-bpm-dialog': {
      'close-btn': 'Закрыть',
      'dropzone-text': 'Загрузите файл в формате .bpmn или.bpmn20.xml BPMN XML',
      'failure-text': 'Чтобы импортировать модель, необходимо добавить хотя бы одну категорию',
      'failure-title': 'Импорт модели процесса',
      text: 'Выберите BPMN XML описание в расширении .bpmn или .bpmn20.xml',
      title: 'Импортировать модель процесса'
    },
    'import-bpm-form': {
      'cancel-btn': 'Отмена',
      'submit-btn': 'Импортировать'
    },
    'import-model': 'Импортировать',
    'process-models': {
      find: 'Найти процесс',
      header: 'Модели бизнес процессов'
    },
    'right-menu': {
      apps: 'Приложения',
      'case-models': 'Модели кейсов',
      'decision-tables': 'Таблицы принятия решений',
      forms: 'Формы',
      'process-models': 'Модели процессов'
    },
    'sort-filter': {
      'a-z': 'По алфавиту A-Z',
      latest: 'Последние измененные',
      old: 'Сначала старые',
      'z-a': 'По алфавиту Z-A'
    },
    total: 'Всего',
    'view-button': 'Просмотр',
    'view-mode': {
      cards: 'Плитка',
      list: 'Список'
    }
  }
};

const header = {
  header: {
    'my-profile': {
      label: 'Мой профиль'
    },
    'make-available': {
      label: 'Сменить статус на "Я на месте"'
    },
    'make-notavailable': {
      label: 'Сменить статус на "Отсутствую"'
    },
    feedback: {
      label: 'Обратная связь'
    },
    reportIssue: {
      label: 'Сообщить о проблеме'
    },
    logout: {
      label: 'Выйти'
    },
    'site-menu': {
      'admin-page': 'Перейти в раздел администратора',
      'home-page': 'Домашняя страница',
      'menu-settings': 'Настроить меню',
      'page-settings': 'Настроить страницу'
    },
    'create-workflow-adhoc': {
      label: 'Поручение'
    },
    'create-workflow-confirm': {
      label: 'Согласование'
    },
    'create-workflow': {
      label: 'Создать задачу'
    }
  },
  create_case: {
    label: 'Создать'
  }
};

const journals = {
  journal: {
    // 'add-filter-criterion': 'Добавить критерий фильтрации',
    // 'apply-criteria': 'Применить',
    // 'create': 'Создать',
    // 'ecos-epics': {
    //   'assignee-name': 'Исполнитель',
    //   'creation-date': 'Дата создания',
    //   'description': 'Описание',
    //   'due-date': 'Дата завершения',
    //   'key': 'Ключ',
    //   'original-estimate': 'Исходная оценка',
    //   'project-name': 'Проект',
    //   'remaining-estimate': 'Оставшееся время',
    //   'reporter-name': 'Инициатор',
    //   'status': 'Статус',
    //   'summary': 'Краткое описание',
    //   'time-spent': 'Потраченное время',
    //   'update-date': 'Дата обновления',
    // },
    // 'ecos-fix-versions': {
    //   'archived': 'В архиве',
    //   'description': 'Описание',
    //   'id': 'ID',
    //   'name': 'Имя',
    //   'original-estimate': 'Исходная оценка',
    //   'project-name': 'Проект',
    //   'release-date': 'Дата релиза',
    //   'released': 'Релиз',
    //   'remaining-estimate': 'Оставшееся время',
    // },
    // 'ecos-issues.assignee-name': 'Исполнитель',
    // 'ecos-issues.creation-date': 'Дата создания',
    // 'ecos-issues.description': 'Описание',
    // 'ecos-issues.due-date': 'Дата завершения',
    // 'ecos-issues.epic-issue-key': 'Ссылка на эпик',
    // 'ecos-issues.key': 'Ключ',
    // 'ecos-issues.original-estimate': 'Исходная оценка',
    // 'ecos-issues.parent-issue-key': 'Родительский тикет',
    // 'ecos-issues.project-name': 'Проект',
    // 'ecos-issues.remaining-estimate': 'Оставшееся время',
    // 'ecos-issues.reporter-name': 'Инициатор',
    // 'ecos-issues.status': 'Статус',
    // 'ecos-issues.summary': 'Краткое описание',
    // 'ecos-issues.time-spent': 'Потраченное время',
    // 'ecos-issues.type': 'Тип',
    // 'ecos-issues.update-date': 'Дата обновления',
    // 'ecos-projects.description': 'Описание',
    // 'ecos-projects.id': 'ID',
    // 'ecos-projects.key': 'Ключ',
    // 'ecos-projects.lead-name': 'Лидер',
    // 'ecos-projects.name': 'Имя',
    // 'ecos-projects.original-estimate': 'Исходная оценка',
    // 'ecos-projects.remaining-estimate': 'Оставшееся время',
    // 'ecos-projects.time-spent': 'Потраченное время',
    // 'ecos-sprints.complete-date': 'Фактическая дата завершения',
    // 'ecos-sprints.end-date': 'Дата завершения',
    // 'ecos-sprints.goal': 'Цель',
    // 'ecos-sprints.id': 'ID',
    // 'ecos-sprints.name': 'Имя',
    // 'ecos-sprints.original-estimate': 'Исходная оценка',
    // 'ecos-sprints.remaining-estimate': 'Оставшееся время',
    // 'ecos-sprints.start-date': 'Дата начала',
    // 'ecos-sprints.state': 'Состояние',
    // 'ecos-users-by-months.display-name': 'Имя',
    // 'ecos-users-by-months.month': 'Месяц',
    // 'ecos-users-by-months.name': 'Имя в системе',
    // 'ecos-users-by-months.time-spent': 'Потраченное время',
    // 'ecos-users.display-name': 'Имя',
    // 'ecos-users.name': 'Имя в системе',
    // 'ecos-users.time-spent': 'Потраченное время',
    // 'elements': 'Элементы',
    // 'filter': 'Фильтр',
    // 'load-button': 'Загрузить',
    // 'pagination': {
    //   'next-page-label': 'Следующая',
    //   'next-page-title': 'Следующая страница',
    //   'previous-page-label': 'Предыдущая',
    //   'previous-page-title': 'Предыдущая страница',
    // },
    // 'search': 'Поиск',
    // 'select-button': 'Выбрать',
    // 'selected-elements': 'Выбранные элементы',

    task: {
      bpm_description: {
        title: 'Название задачи'
      },
      statistics: {
        actual_perform_time: {
          title: 'Время выполнения, ч.'
        },
        completion_date: {
          title: 'Дата завершения'
        },
        date: {
          title: 'Дата начала'
        },
        document: {
          title: 'Документ'
        },
        expected_perform_time: {
          title: 'Ожидаемое время выполнения, ч.'
        },
        initiator: {
          title: 'Исполнитель'
        },
        perform_time_ration: {
          title: 'Ожидаемое время / Время выполнения'
        },
        task_type: {
          title: 'Тип задачи'
        }
      }
    },

    title: 'Журнал'
  },

  journals: {
    action: {
      apply: 'Применить',
      'apply-template': 'Сохр. изменения',
      cancel: 'Отмена',
      'cancel-rename-tpl-msg': 'Отменить переименование шаблона',
      'create-template': 'Создать шаблон',
      delete: 'Удалить',
      'delete-filter-group-msg': 'Удаление группы фильтров',
      'delete-filter-msg': 'Удаление фильтра',
      'delete-records-msg': 'Удаление записей',
      'delete-tpl-msg': 'Удаление шаблона',
      'dialog-msg': 'Введите название шаблона',
      'edit-dashlet': 'Редактирование дашлета',
      'hide-menu': 'Скрыть меню',
      'only-linked': 'Отображать только связанные записи',
      'remove-filter-group-msg': 'Удалить группу фильтров?',
      'remove-filter-msg': 'Удалить фильтр?',
      'remove-records-msg': 'Вы действительно хотите удалить записи?',
      'remove-tpl-msg': 'Удалить шаблон',
      'rename-tpl-msg': 'Переименовать шаблон',
      reset: 'Сбросить',
      'reset-settings': 'Сбросить настройки',
      save: 'Сохранить',
      'select-journal': 'Выберите журнал',
      'select-journal-list': 'Выберите список журналов',
      'setting-dialog-msg': 'Настройки таблицы',
      'show-menu': 'Показать меню'
    },
    'columns-setup': {
      header: 'Настройка колонок'
    },
    'create-record-btn': 'Создать',
    default: 'По умолчанию',
    'filter-list': {
      header: 'Журналы'
    },
    grouping: {
      header: 'Группировка'
    },
    list: {
      name: 'Список журналов'
    },
    name: 'Журналы',
    settings: 'Настройки',
    tpl: {
      defaults: 'Шаблоны настроек'
    }
  },

  'filter-list': {
    'add-criterion': 'Добавить критерий',
    'add-operator': 'Добавить оператор',
    'condition-group': 'Группу условий',
    criterion: 'Критерий',
    'filter-group-add': 'Добавить',
    'panel-header': 'Фильтрация'
  },

  'columns-setup': {
    ascending: 'По возрастанию',
    descending: 'По убыванию',
    order: 'Порядок и отображение колонок',
    sort: 'Сортировка в колонке'
  }
};

const common = {
  relative: {
    day: 'вчера',
    days: '{{value}} дн. назад',
    earlierThisWeek: 'Ранее на этой неделе',
    hour: 'около часа назад',
    hours: '{{value}} ч назад',
    lastWeek: 'На прошлой неделе',
    laterThisWeek: 'Позднее на этой неделе',
    minute: 'минуту назад',
    minutes: '{{value}} мин назад',
    month: 'около месяца назад',
    months: '{{value}} мес. назад',
    nextWeek: 'На следующей неделе',
    seconds: 'только что',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    year: 'около года назад',
    years: 'более {{value}} лет назад',
    yesterday: 'Вчера'
  },

  size: {
    bytes: 'б',
    gigabytes: 'ГБ',
    kilobytes: 'КБ',
    megabytes: 'МБ'
  },

  search: {
    documents: 'Документы',
    label: 'Найти файл, человека или раздел',
    'no-results': 'Ничего не найдено',
    people: 'Люди',
    placeholder: 'Найти',
    'show-more-results': 'Показать все результаты',
    sites: 'Разделы',
    size: 'Размер'
  },

  'page-tabs': {
    'bpmn-designer': 'Редактор бизнес-процессов',
    'dashboard-settings': 'Настройка страницы',
    'home-page': 'Домашняя страница',
    journal: 'Журнал',
    'new-tab': 'Новая вкладка',
    'no-name': 'Без имени',
    'tab-name': 'Название вкладки'
  },

  predicate: {
    and: 'И',
    any: 'Любое значение',
    'aspect-equals': 'Равно',
    'aspect-not-equals': 'Не равно',
    'assoc-contains': 'Содержит',
    'assoc-empty': 'Пусто',
    'assoc-not-contains': 'Не содержит',
    'assoc-not-empty': 'Не пусто',
    'boolean-empty': 'Пусто',
    'boolean-false': 'Нет',
    'boolean-not-empty': 'Не пусто',
    'boolean-true': 'Да',
    contains: 'Содержит',
    'date-empty': 'Пусто',
    'date-equals': 'Равно',
    'date-greater-or-equal': 'Больше или равно',
    'date-less-or-equal': 'Меньше или равно',
    'date-less-than': 'Меньше',
    'date-not-empty': 'Не пусто',
    'date-not-equals': 'Не равно',
    empty: 'Пусто',
    ends: 'Заканчивается на',
    eq: 'Равно',
    ge: 'Больше или равно',
    gt: 'Больше',
    le: 'Меньше или равно',
    'list-equals': 'Равно',
    'list-not-equals': 'Не равно',
    lt: 'Меньше',
    'noderef-contains': 'Содержит',
    'noderef-empty': 'Пусто',
    'noderef-not-contains': 'Не содержит',
    'noderef-not-empty': 'Не пусто',
    'not-contains': 'Не содержит',
    'not-empty': 'Не пусто',
    'not-eq': 'Не равно',
    'number-equals': 'Равно',
    'number-greater-or-equal': 'Больше или равно',
    'number-greater-than': 'Больше',
    'number-less-or-equal': 'Меньше или равно',
    'number-less-than': 'Меньше',
    'number-not-equals': 'Не равно',
    or: 'Или',
    'path-child': 'Содержится непосредственно внутри',
    'path-descendant': 'Содержится внутри',
    'path-equals': 'Равно',
    starts: 'Начинается с',
    'string-contains': 'Содержит',
    'string-empty': 'Пусто',
    'string-ends-with': 'Заканчивается на',
    'string-equals': 'Равно',
    'string-not-empty': 'Не пусто',
    'string-not-equals': 'Не равно',
    'string-starts-with': 'Начинается с',
    'type-equals': 'Равно',
    'type-not-equals': 'Не равно'
  },

  'dashlet.comments.description': 'Показать последние комментарии',
  'dashlet.comments.shortName': 'Последние комментарии',
  'dashlet.edit.title': 'Настроить этот дашлет',
  'dashlet.edit.tooltip': 'Настроить этот дашлет',
  'dashlet.goto': 'Перейти в раздел',
  'dashlet.help.title': 'Справка',
  'dashlet.help.tooltip': 'Показать справку по этому дашлету',
  'dashlet.journals-dashlet.description': 'Удобный поиск и табличное отображение любых объектов репозитория',
  'dashlet.journals-dashlet.shortName': 'Журналы',
  'dashlet.journals.description': 'Журналы 2.0',
  'dashlet.journals.shortName': 'Журналы 2.0',
  'dashlet.move.title': 'Переместить',
  'dashlet.pentaho-reports.description': 'Добавить список отчетов в системе Pentaho для отображения на сайте',
  'dashlet.pentaho-reports.shortName': 'Отчеты Pentaho',
  'dashlet.resize.title': 'Изменить размер',
  'dashlet.rss.tooltip': 'Подписаться на RSS-канал для этого дашлета',
  'dashlet.update.title': 'Обновить данные'
};

export default {
  ...header,
  ...bpmnDesigner,
  ...journals,
  ...common
};
