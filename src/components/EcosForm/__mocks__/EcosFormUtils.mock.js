export const simpleCase = {
  components: [
    {
      label: 'Text Field',
      allowMultipleMasks: false,
      showWordCount: false,
      showCharCount: false,
      tableView: true,
      defaultValue: '',
      inputFormat: 'plain',
      key: 'textField2',
      logic: [],
      type: 'textfield',
      input: true,
      tags: [],
      widget: {
        type: '',
        format: 'yyyy-MM-dd hh:mm a',
        dateFormat: 'yyyy-MM-dd hh:mm a',
        saveAs: 'text'
      },
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: '',
        minLength: '',
        maxLength: '',
        minWords: '',
        maxWords: '',
        pattern: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      inputType: 'text',
      inputMask: '',
      id: 'eky7mj'
    },
    {
      type: 'button',
      label: 'Submit',
      key: 'submit',
      disableOnInvalid: true,
      theme: 'primary',
      input: true,
      tableView: true,
      logic: [],
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      defaultValue: null,
      protected: false,
      unique: false,
      persistent: false,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: true,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      size: 'md',
      leftIcon: '',
      rightIcon: '',
      block: false,
      action: 'submit',
      removeIndents: false,
      id: 'eizsftr'
    }
  ]
};

export const simpleCaseOptimized = {
  components: [
    {
      defaultValue: '',
      key: 'textField2',
      type: 'textfield',
      input: true
    },
    {
      type: 'button',
      key: 'submit',
      disableOnInvalid: true,
      theme: 'primary',
      input: true
    }
  ]
};

export const emptyObjectsCase = {
  components: [
    {
      key: 'textField',
      type: 'textfield',
      input: true,
      conditional: {},
      validate: {},
      widget: {},
      attributes: {},
      properties: {}
    }
  ]
};

export const emptyObjectsCaseOptimized = {
  components: [
    {
      key: 'textField',
      type: 'textfield',
      input: true
    }
  ]
};

export const ecosSelectCase = {
  components: [
    {
      label: 'Select',
      tableView: true,
      dataSrc: 'values',
      data: {
        url: '/citeck/ecos/records/query',
        values: [
          {
            label: 'value 1',
            value: 'value1'
          },
          {
            label: 'value 2',
            value: 'value2'
          }
        ],
        json: '',
        resource: '',
        custom: ''
      },
      refreshOn: [],
      key: 'select',
      logic: [],
      type: 'ecosSelect',
      input: true,
      tags: [],
      defaultValue: '',
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      limit: 100,
      valueProperty: 'value',
      filter: '',
      searchEnabled: true,
      searchField: '',
      minSearch: 0,
      readOnlyValue: false,
      authenticate: false,
      template: '<span>{{ item.label }}</span>',
      selectFields: '',
      searchThreshold: 0.3,
      fuseOptions: {},
      customOptions: {},
      refreshEventName: '',
      dataPreProcessingCode: '',
      unavailableItems: {
        isActive: false,
        code: ''
      },
      lazyLoad: false,
      selectValues: '',
      disableLimit: false,
      sort: '',
      refreshOnEvent: false,
      selectThreshold: 0.3,
      id: 'e37op5ho'
    }
  ]
};

export const ecosSelectCaseOptimized = {
  components: [
    {
      dataSrc: 'values',
      data: {
        values: [
          {
            label: 'value 1',
            value: 'value1'
          },
          {
            label: 'value 2',
            value: 'value2'
          }
        ]
      },
      key: 'select',
      type: 'ecosSelect',
      input: true,
      defaultValue: ''
    }
  ]
};

export const datetimeCase = {
  components: [
    {
      datePicker: {
        minDate: '',
        maxDate: '',
        showWeeks: true,
        startingDay: 0,
        initDate: '',
        minMode: 'day',
        maxMode: 'year',
        yearRows: 4,
        yearColumns: 5
      },
      defaultValue: '',
      key: 'dateTime2',
      type: 'datetime',
      input: true,
      suffix: true,
      tableView: true,
      label: 'Date / Time',
      widget: {
        type: 'calendar',
        displayInTimezone: 'viewer',
        language: 'en',
        useLocaleSettings: false,
        allowInput: true,
        mode: 'single',
        enableTime: true,
        noCalendar: false,
        format: 'yyyy-MM-dd hh:mm a',
        defaultDate: '',
        hourIncrement: 1,
        minuteIncrement: 1,
        time_24hr: false,
        minDate: '',
        maxDate: '',
        icons: '',
        i18n: {
          lng: 'en',
          resources: {
            en: {
              translation: {
                complete: 'Submission Complete',
                error: 'Please fix the following errors before submitting.',
                required: '{{field}} is required',
                pattern: '{{field}} does not match the pattern {{pattern}}',
                minLength: '{{field}} must be longer than {{length}} characters.',
                maxLength: '{{field}} must be shorter than {{length}} characters.',
                minWords: '{{field}} must have more than {{length}} words.',
                maxWords: '{{field}} must have less than {{length}} words.',
                min: '{{field}} cannot be less than {{min}}.',
                max: '{{field}} cannot be greater than {{max}}.',
                minSelectedCount: 'You must select at least {{minCount}} items to continue.',
                maxSelectedCount: 'You can only select up to {{maxCount}} items to continue.',
                maxDate: '{{field}} should not contain date after {{- maxDate}}',
                minDate: '{{field}} should not contain date before {{- minDate}}',
                invalid_email: '{{field}} must be a valid email.',
                invalid_url: '{{field}} must be a valid url.',
                invalid_regex: '{{field}} does not match the pattern {{regex}}.',
                invalid_date: '{{field}} is not a valid date.',
                invalid_day: '{{field}} is not a valid day.',
                mask: '{{field}} does not match the mask.',
                stripe: '{{stripe}}',
                month: 'Month',
                day: 'Day',
                year: 'Year',
                january: 'January',
                february: 'February',
                march: 'March',
                april: 'April',
                may: 'May',
                june: 'June',
                july: 'July',
                august: 'August',
                september: 'September',
                october: 'October',
                november: 'November',
                december: 'December',
                next: 'Next',
                previous: 'Previous',
                cancel: 'Cancel',
                submit: 'Submit Form'
              }
            },
            ru: {
              translation: {
                invalid_email: '{{field}} некорректный email.',
                next: 'Далее',
                complete: 'Сохранение прошло успешно',
                previous: 'Назад',
                min: '{{field}} не может быть меньше чем {{min}}.',
                pattern: '{{field}} не совпадает с паттерном {{pattern}}',
                or: 'или',
                minLength: '{{field}} должен быть длиннее чем {{length}} символов.',
                error: 'Пожалуйста, исправьте следующие ошибки перед отправкой:',
                invalid_date: '{{field}} некорректная дата.',
                browse: 'выбрать',
                maxLength: '{{field}} должен быть короче чем {{length}} символов.',
                max: '{{field}} не может быть больше чем {{max}}.',
                mask: '{{field}} не совпадает с маской.',
                invalid_regex: '{{field}} не соответствует паттерну {{regex}}.',
                'File Name': 'Имя файла',
                Type: 'Тип',
                required: 'Поле {{field}} не может быть пустым',
                'Drop files to attach, or': 'Перетащите файлы для прикрепления, или',
                Size: 'Размер'
              }
            }
          }
        }
      },
      logic: [],
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      multiple: false,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      format: 'yyyy-MM-dd hh:mm a',
      useLocaleSettings: false,
      allowInput: true,
      enableDate: true,
      enableTime: true,
      defaultDate: '',
      displayInTimezone: 'viewer',
      timezone: '',
      datepickerMode: 'day',
      timePicker: {
        hourStep: 1,
        minuteStep: 1,
        showMeridian: true,
        readonlyInput: false,
        mousewheel: true,
        arrowkeys: true
      },
      id: 'e1vftei'
    }
  ]
};

export const datetimeCaseOptimized = {
  components: [
    {
      datePicker: {
        minDate: '',
        maxDate: ''
      },
      defaultValue: '',
      key: 'dateTime2',
      type: 'datetime',
      input: true,
      suffix: true
    }
  ]
};

export const asyncDataCase = {
  components: [
    {
      source: {
        type: 'custom',
        custom: {
          syncData: 'value = 123;',
          asyncData: 'value = Promise.resolve(data);'
        },
        forceLoad: false,
        ajax: {
          method: 'GET',
          url: '',
          data: '',
          mapping: ''
        },
        record: {
          id: '',
          attributes: {}
        },
        recordsArray: {
          id: '',
          attributes: {}
        },
        recordsScript: {
          script: '',
          attributes: {}
        },
        recordsQuery: {
          query: '',
          attributes: {},
          isSingle: false
        }
      },
      update: {
        type: 'disabled',
        event: '',
        rate: 100,
        force: false
      },
      key: 'asyncData2',
      type: 'asyncData',
      input: true,
      tableView: true,
      label: 'Async Data',
      refreshOn: [],
      logic: [],
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      defaultValue: null,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      inputType: 'asyncData',
      eventName: '',
      executionCondition: '',
      ignoreValuesEqualityChecking: false,
      id: 'e03b2of'
    }
  ]
};

export const asyncDataCaseOptimized = {
  components: [
    {
      source: {
        type: 'custom',
        custom: {
          syncData: 'value = 123;',
          asyncData: 'value = Promise.resolve(data);'
        },
        forceLoad: false
      },
      update: {
        type: 'disabled'
      },
      key: 'asyncData2',
      type: 'asyncData',
      input: true
    }
  ]
};

export const datamapCase = {
  components: [
    {
      keyLabel: '',
      key: 'dataMap2',
      type: 'datamap',
      input: true,
      valueComponent: {
        type: 'textfield',
        key: 'value',
        label: 'Value',
        defaultValue: 'Value',
        input: true,
        tableView: true,
        logic: [],
        tags: [],
        placeholder: '',
        prefix: '',
        customClass: '',
        suffix: '',
        multiple: false,
        protected: false,
        unique: false,
        persistent: true,
        hidden: false,
        clearOnHide: true,
        dataGridLabel: false,
        labelPosition: 'top',
        labelWidth: 30,
        labelMargin: 3,
        description: '',
        errorLabel: '',
        tooltip: '',
        hideLabel: false,
        tabindex: '',
        disabled: false,
        autofocus: false,
        dbIndex: false,
        customDefaultValue: '',
        calculateValue: '',
        allowCalculateOverride: false,
        widget: {
          format: 'yyyy-MM-dd hh:mm a',
          dateFormat: 'yyyy-MM-dd hh:mm a',
          saveAs: 'text'
        },
        refreshOn: '',
        clearOnRefresh: false,
        validateOn: 'change',
        validate: {
          required: false,
          custom: '',
          customPrivate: false,
          customMessage: '',
          json: '',
          minLength: '',
          maxLength: '',
          minWords: '',
          maxWords: '',
          pattern: ''
        },
        conditional: {
          show: '',
          when: '',
          eq: '',
          json: ''
        },
        alwaysEnabled: false,
        attributes: {},
        customConditional: '',
        disableInlineEdit: false,
        encrypted: false,
        mask: false,
        properties: {},
        shortcut: '',
        triggerChangeWhenCalculate: false,
        inputType: 'text',
        inputMask: '',
        id: 'ehfpn5'
      },
      tableView: true,
      label: 'Data Map',
      logic: [],
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      defaultValue: null,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: '',
        maxLength: 0,
        minLength: 0
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      addAnother: 'Add Another',
      disableAddingRemovingRows: false,
      keyBeforeValue: true,
      id: 'e4pvinq'
    }
  ]
};

export const datamapCaseOptimized = {
  components: [
    {
      keyLabel: '',
      key: 'dataMap2',
      type: 'datamap',
      input: true
    }
  ]
};

export const selectJournalCase = {
  components: [
    {
      label: 'SelectJournal',
      tableView: true,
      journalId: 'legal-entities',
      displayColumns: ['idocs:fullOrganizationName', 'idocs:generalDirector'],
      source: {
        type: 'journal',
        custom: {
          columns: []
        },
        viewMode: 'default'
      },
      defaultValue: '',
      displayColumnsAsyncData: [
        {
          label: 'Полное наименование',
          value: 'idocs:fullOrganizationName'
        },
        {
          label: 'Альтернативное наименование',
          value: 'idocs:shortOrganizationName'
        },
        {
          label: 'ИНН',
          value: 'idocs:inn'
        },
        {
          label: 'КПП',
          value: 'idocs:kpp'
        },
        {
          label: 'ОКПО',
          value: 'idocs:okpo'
        },
        {
          label: 'ОГРН',
          value: 'idocs:ogrn'
        },
        {
          label: 'Юридический адрес',
          value: 'idocs:juridicalAddress'
        },
        {
          label: 'Фактический адрес',
          value: 'idocs:postAddress'
        },
        {
          label: 'Генеральный директор',
          value: 'idocs:generalDirector'
        },
        {
          label: 'Главный бухгалтер',
          value: 'idocs:accountantGeneral'
        },
        {
          label: 'Номер телефона',
          value: 'idocs:phoneNumber'
        }
      ],
      key: 'selectJournal2',
      logic: [],
      type: 'selectJournal',
      input: true,
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      customPredicateJs: '',
      presetFilterPredicatesJs: '',
      hideCreateButton: false,
      hideEditRowButton: false,
      hideDeleteRowButton: false,
      isFullScreenWidthModal: false,
      isSelectedValueAsText: false,
      isTableMode: false,
      sortAttribute: 'sys:node-dbid',
      sortAscending: 'asc',
      computed: {
        valueDisplayName: ''
      },
      searchField: '',
      ecos: {
        dataType: 'assoc'
      },
      id: 'e8yy6rt'
    }
  ]
};

export const selectJournalCaseOptimized = {
  components: [
    {
      journalId: 'legal-entities',
      displayColumns: ['idocs:fullOrganizationName', 'idocs:generalDirector'],
      key: 'selectJournal2',
      type: 'selectJournal',
      input: true
    }
  ]
};

export const tableFormCase = {
  components: [
    {
      label: 'TableForm',
      tableView: true,
      source: {
        type: 'journal',
        journal: {
          journalId: 'legal-entities',
          columns: ['idocs:fullOrganizationName', 'idocs:phoneNumber']
        },
        custom: {
          columns: [],
          record: null,
          attribute: null
        }
      },
      computed: {
        valueFormKey: ''
      },
      defaultValue: [],
      displayColumnsAsyncData: [
        {
          label: 'Полное наименование',
          value: 'idocs:fullOrganizationName'
        },
        {
          label: 'Альтернативное наименование',
          value: 'idocs:shortOrganizationName'
        },
        {
          label: 'ИНН',
          value: 'idocs:inn'
        },
        {
          label: 'КПП',
          value: 'idocs:kpp'
        },
        {
          label: 'ОКПО',
          value: 'idocs:okpo'
        },
        {
          label: 'ОГРН',
          value: 'idocs:ogrn'
        },
        {
          label: 'Юридический адрес',
          value: 'idocs:juridicalAddress'
        },
        {
          label: 'Фактический адрес',
          value: 'idocs:postAddress'
        },
        {
          label: 'Генеральный директор',
          value: 'idocs:generalDirector'
        },
        {
          label: 'Главный бухгалтер',
          value: 'idocs:accountantGeneral'
        },
        {
          label: 'Номер телефона',
          value: 'idocs:phoneNumber'
        }
      ],
      key: 'tableForm2',
      logic: [],
      type: 'tableForm',
      input: true,
      tags: [],
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      protected: false,
      unique: false,
      persistent: true,
      hidden: false,
      clearOnHide: true,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        customMessage: '',
        json: ''
      },
      conditional: {
        show: '',
        when: '',
        eq: '',
        json: ''
      },
      alwaysEnabled: false,
      attributes: {},
      customConditional: '',
      disableInlineEdit: false,
      encrypted: false,
      mask: false,
      properties: {},
      shortcut: '',
      triggerChangeWhenCalculate: false,
      eventName: '',
      customCreateVariantsJs: '',
      isStaticModalTitle: false,
      customStringForConcatWithStaticTitle: '',
      isSelectableRows: false,
      displayElementsJS: '',
      nonSelectableRowsJS: '',
      selectedRowsJS: '',
      import: {
        enable: false,
        uploadUrl: '',
        responseHandler: ''
      },
      triggerEventOnChange: false,
      isInstantClone: false,
      id: 'ez00qsy'
    }
  ]
};

export const tableFormCaseOptimized = {
  components: [
    {
      source: {
        type: 'journal',
        journal: {
          journalId: 'legal-entities',
          columns: ['idocs:fullOrganizationName', 'idocs:phoneNumber']
        }
      },
      key: 'tableForm2',
      type: 'tableForm',
      input: true
    }
  ]
};

export const columnsCase = {
  components: [
    {
      conditional: {
        show: '',
        json: '',
        when: '',
        eq: ''
      },
      columns: [
        {
          type: 'column',
          md: 6,
          offset: 0,
          index: 0,
          clearOnHide: false,
          push: 0,
          input: false,
          components: [],
          classes: '',
          sm: 12,
          key: 'column37',
          hideOnChildrenHidden: false,
          tableView: true,
          label: '',
          pull: 0,
          xl: 0,
          width: 4,
          xs: 0,
          lg: 0,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          dataGridLabel: false,
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          id: 'emfmp37'
        },
        {
          type: 'column',
          md: 6,
          offset: 0,
          index: 1,
          clearOnHide: false,
          push: 0,
          input: false,
          components: [],
          classes: '',
          sm: 12,
          key: 'column38',
          hideOnChildrenHidden: false,
          tableView: true,
          label: '',
          pull: 0,
          xl: 0,
          width: 4,
          xs: 0,
          lg: 0,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          dataGridLabel: false,
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          id: 'e3bzra8'
        },
        {
          type: 'column',
          md: 6,
          offset: 0,
          index: 2,
          clearOnHide: false,
          push: 0,
          input: false,
          components: [],
          classes: '',
          sm: 12,
          key: 'column39',
          hideOnChildrenHidden: false,
          tableView: true,
          label: '',
          pull: 0,
          xl: 0,
          width: 4,
          xs: 0,
          lg: 0,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          dataGridLabel: false,
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          id: 'etz4cio'
        },
        {
          components: [],
          type: 'column',
          input: false,
          key: 'column',
          index: 0,
          xs: 0,
          sm: 12,
          md: 6,
          lg: 0,
          xl: 0,
          classes: '',
          hideOnChildrenHidden: false,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          clearOnHide: false,
          tableView: true,
          dataGridLabel: false,
          label: '',
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false,
            customMessage: '',
            json: ''
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          alwaysEnabled: false,
          attributes: {},
          customConditional: '',
          disableInlineEdit: false,
          encrypted: false,
          logic: [],
          mask: false,
          properties: {},
          shortcut: '',
          tags: [],
          triggerChangeWhenCalculate: false,
          width: 6,
          offset: 0,
          push: 0,
          pull: 0,
          id: 'ekywsqx'
        },
        {
          sm: 6,
          md: 3,
          lg: 2,
          type: 'column',
          input: false,
          key: 'column',
          index: 1,
          hideOnChildrenHidden: false,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          clearOnHide: false,
          tableView: true,
          dataGridLabel: false,
          label: '',
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false,
            customMessage: '',
            json: ''
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          alwaysEnabled: false,
          attributes: {},
          customConditional: '',
          disableInlineEdit: false,
          encrypted: false,
          logic: [],
          mask: false,
          properties: {},
          shortcut: '',
          tags: [],
          triggerChangeWhenCalculate: false,
          classes: '',
          xs: 0,
          xl: 0,
          width: 6,
          offset: 0,
          push: 0,
          pull: 0,
          id: 'eexlga'
        },
        {
          sm: 6,
          md: 3,
          lg: 10,
          type: 'column',
          input: false,
          key: 'column',
          index: 2,
          hideOnChildrenHidden: false,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          clearOnHide: false,
          tableView: true,
          dataGridLabel: false,
          label: '',
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false,
            customMessage: '',
            json: ''
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          alwaysEnabled: false,
          attributes: {},
          customConditional: '',
          disableInlineEdit: false,
          encrypted: false,
          logic: [],
          mask: false,
          properties: {},
          shortcut: '',
          tags: [],
          triggerChangeWhenCalculate: false,
          classes: '',
          xs: 0,
          xl: 0,
          width: 6,
          offset: 0,
          push: 0,
          pull: 0,
          id: 'efq73w'
        },
        {
          md: 3,
          xl: 6,
          classes: 'some-class',
          type: 'column',
          input: false,
          key: 'column',
          index: 3,
          hideOnChildrenHidden: false,
          placeholder: '',
          prefix: '',
          customClass: '',
          suffix: '',
          multiple: false,
          defaultValue: null,
          protected: false,
          unique: false,
          persistent: true,
          hidden: false,
          clearOnHide: false,
          tableView: true,
          dataGridLabel: false,
          label: '',
          labelPosition: 'top',
          labelWidth: 30,
          labelMargin: 3,
          description: '',
          errorLabel: '',
          tooltip: '',
          hideLabel: false,
          tabindex: '',
          disabled: false,
          autofocus: false,
          dbIndex: false,
          customDefaultValue: '',
          calculateValue: '',
          allowCalculateOverride: false,
          widget: null,
          refreshOn: '',
          clearOnRefresh: false,
          validateOn: 'change',
          validate: {
            required: false,
            custom: '',
            customPrivate: false,
            customMessage: '',
            json: ''
          },
          conditional: {
            show: '',
            when: '',
            eq: '',
            json: ''
          },
          alwaysEnabled: false,
          attributes: {},
          customConditional: '',
          disableInlineEdit: false,
          encrypted: false,
          logic: [],
          mask: false,
          properties: {},
          shortcut: '',
          tags: [],
          triggerChangeWhenCalculate: false,
          xs: 0,
          sm: 12,
          lg: 0,
          width: 6,
          offset: 0,
          push: 0,
          pull: 0,
          id: 'e9tgrrj'
        }
      ],
      type: 'columns',
      key: 'columns9',
      mask: false,
      customConditional: '',
      tableView: false,
      label: 'Columns',
      tags: [],
      input: false,
      alwaysEnabled: false,
      logic: [],
      properties: {},
      placeholder: '',
      prefix: '',
      customClass: '',
      suffix: '',
      multiple: false,
      defaultValue: null,
      protected: false,
      unique: false,
      persistent: false,
      hidden: false,
      clearOnHide: false,
      dataGridLabel: false,
      labelPosition: 'top',
      labelWidth: 30,
      labelMargin: 3,
      description: '',
      errorLabel: '',
      tooltip: '',
      hideLabel: false,
      tabindex: '',
      disabled: false,
      autofocus: false,
      dbIndex: false,
      customDefaultValue: '',
      calculateValue: '',
      allowCalculateOverride: false,
      widget: null,
      refreshOn: '',
      clearOnRefresh: false,
      validateOn: 'change',
      validate: {
        required: false,
        custom: '',
        customPrivate: false
      },
      inlineColumns: false,
      autoAdjust: false,
      hideOnChildrenHidden: false,
      id: 'exrfpts'
    }
  ]
};

export const columnsCaseOptimized = {
  components: [
    {
      columns: [
        {
          type: 'column',
          index: 0,
          input: false,
          components: [],
          key: 'column37',
          width: 4
        },
        {
          type: 'column',
          index: 1,
          input: false,
          components: [],
          key: 'column38',
          width: 4
        },
        {
          type: 'column',
          index: 2,
          input: false,
          components: [],
          key: 'column39',
          width: 4
        },
        {
          components: [],
          type: 'column',
          input: false,
          key: 'column',
          index: 0
        },
        {
          sm: 6,
          md: 3,
          lg: 2,
          type: 'column',
          input: false,
          key: 'column',
          index: 1
        },
        {
          sm: 6,
          md: 3,
          lg: 10,
          type: 'column',
          input: false,
          key: 'column',
          index: 2
        },
        {
          md: 3,
          xl: 6,
          classes: 'some-class',
          type: 'column',
          input: false,
          key: 'column',
          index: 3
        }
      ],
      type: 'columns',
      key: 'columns9',
      input: false
    }
  ]
};

export const dataGridAssocCaseOptimized = {
  components: [
    {
      key: 'datagridAssoc',
      type: 'datagridAssoc',
      input: true,
      multiple: true
    }
  ]
};
