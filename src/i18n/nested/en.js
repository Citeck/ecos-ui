const bpmnDesigner = {
  'bpmn-designer': {
    'add-category': 'Create category',
    'category-action': {
      access: 'Access',
      'add-subcategory': 'Add subcategory',
      'create-model': 'Create model',
      delete: 'Delete',
      rename: 'Rename'
    },
    'create-bpm-dialog': {
      'close-btn': 'Close',
      'failure-text': 'You should first create at least one category',
      'failure-title': 'Create a business process model',
      title: 'Create a business process model'
    },
    'create-bpm-form': {
      author: 'Author',
      'cancel-btn': 'Cancel',
      category: 'Category',
      description: 'Description (optional)',
      owner: 'Process owner',
      'process-key': 'Process key',
      'process-key-placeholder': '',
      reviewers: 'Process Reviewer',
      'submit-btn': 'Create model',
      title: 'Model name',
      'title-placeholder': 'Model name',
      'valid-from': 'Valid from',
      'valid-to': 'Valid to'
    },
    'create-model': 'Create model',
    'create-model-card': {
      label: 'Create'
    },
    'delete-category-dialog': {
      'cancel-btn': 'Cancel',
      'close-btn': 'Close',
      'delete-btn': 'Delete',
      'failure-text': 'The category is not empty',
      'failure-title': 'Failure',
      text: 'Do you really want to delete the category?',
      title: 'Delete category'
    },
    'import-bpm-dialog': {
      'close-btn': 'Close',
      'dropzone-text': 'Drop a .bpmn or .bpmn20.xml BPMN XML file',
      'failure-text': 'You should first create at least one category',
      'failure-title': 'Import process model',
      text: 'Please browse for or drop a BPMN XML definition with an .bpmn or .bpmn20.xml extension',
      title: 'Import process model'
    },
    'import-bpm-form': {
      'cancel-btn': 'Cancel',
      'submit-btn': 'Import'
    },
    'import-model': 'Import',
    'process-models': {
      find: 'Find process',
      header: 'Business process models'
    },
    'right-menu': {
      apps: 'Apps',
      'case-models': 'Case models',
      'decision-tables': 'Decision tables',
      forms: 'Forms',
      'process-models': 'Process models'
    },
    'sort-filter': {
      'a-z': 'Alphabetically A-Z',
      latest: 'Last modified',
      old: 'Old first',
      'z-a': 'Alphabetically Z-A'
    },
    total: 'Total',
    'view-button': 'View',
    'view-mode': {
      cards: 'Cards',
      list: 'List'
    }
  }
};

const header = {
  header: {
    'my-profile': {
      label: 'My Profile'
    },
    'make-available': {
      label: 'Change status to "I\'m here"'
    },
    'make-notavailable': {
      label: 'Change status to "I\'m absent"'
    },
    feedback: {
      label: 'Give feedback'
    },
    reportIssue: {
      label: 'Report an issue'
    },
    logout: {
      label: 'Logout'
    },
    'site-menu': {
      'admin-page': 'Go to admin page',
      'home-page': 'Home page',
      'menu-settings': 'Menu settings',
      'page-settings': 'Page settings'
    },
    'create-workflow-adhoc': {
      label: 'Assignment'
    },
    'create-workflow-confirm': {
      label: 'Approval'
    },
    'create-workflow': {
      label: 'Create Task'
    }
  },
  create_case: {
    label: 'Create'
  }
};

const journals = {
  journal: {
    // 'add-filter-criterion': 'Add Filter Criterion',
    // 'apply-criteria': 'Apply Criteria',
    // 'create': 'Create',
    // 'ecos-epics.assignee-name': 'Assignee',
    // 'ecos-epics.creation-date': 'Creation date',
    // 'ecos-epics.description': 'Description',
    // 'ecos-epics.due-date': 'Due date',
    // 'ecos-epics.key': 'Key',
    // 'ecos-epics.original-estimate': 'Original estimate',
    // 'ecos-epics.project-name': 'Project',
    // 'ecos-epics.remaining-estimate': 'Remaining estimate',
    // 'ecos-epics.reporter-name': 'Reporter',
    // 'ecos-epics.status': 'Status',
    // 'ecos-epics.summary': 'Summary',
    // 'ecos-epics.time-spent': 'Time spent',
    // 'ecos-epics.update-date': 'Update date',
    // 'ecos-fix-versions.archived': 'Archived',
    // 'ecos-fix-versions.description': 'Description',
    // 'ecos-fix-versions.id': 'ID',
    // 'ecos-fix-versions.name': 'Name',
    // 'ecos-fix-versions.original-estimate': 'Original estimate',
    // 'ecos-fix-versions.project-name': 'Project',
    // 'ecos-fix-versions.release-date': 'Release date',
    // 'ecos-fix-versions.released': 'Released',
    // 'ecos-fix-versions.remaining-estimate': 'Remaining estimate',
    // 'ecos-issues.assignee-name': 'Assignee',
    // 'ecos-issues.creation-date': 'Creation date',
    // 'ecos-issues.description': 'Description',
    // 'ecos-issues.due-date': 'Due date',
    // 'ecos-issues.epic-issue-key': 'Epic link',
    // 'ecos-issues.key': 'Key',
    // 'ecos-issues.original-estimate': 'Original estimate',
    // 'ecos-issues.parent-issue-key': 'Parent issue',
    // 'ecos-issues.project-name': 'Project',
    // 'ecos-issues.remaining-estimate': 'Remaining estimate',
    // 'ecos-issues.reporter-name': 'Reporter',
    // 'ecos-issues.status': 'Status',
    // 'ecos-issues.summary': 'Summary',
    // 'ecos-issues.time-spent': 'Time spent',
    // 'ecos-issues.type': 'Type',
    // 'ecos-issues.update-date': 'Update date',
    // 'ecos-projects.description': 'Description',
    // 'ecos-projects.id': 'ID',
    // 'ecos-projects.key': 'Key',
    // 'ecos-projects.lead-name': 'Lead',
    // 'ecos-projects.name': 'Name',
    // 'ecos-projects.original-estimate': 'Original estimate',
    // 'ecos-projects.remaining-estimate': 'Remaining estimate',
    // 'ecos-projects.time-spent': 'Time spent',
    // 'ecos-sprints.complete-date': 'Complete date',
    // 'ecos-sprints.end-date': 'End date',
    // 'ecos-sprints.goal': 'Goal',
    // 'ecos-sprints.id': 'ID',
    // 'ecos-sprints.name': 'Name',
    // 'ecos-sprints.original-estimate': 'Original estimate',
    // 'ecos-sprints.remaining-estimate': 'Remaining estimate',
    // 'ecos-sprints.start-date': 'Start date',
    // 'ecos-sprints.state': 'State',
    // 'ecos-users-by-months.display-name': 'Display name',
    // 'ecos-users-by-months.month': 'Month',
    // 'ecos-users-by-months.name': 'Name',
    // 'ecos-users-by-months.time-spent': 'Time spent',
    // 'ecos-users.display-name': 'Display name',
    // 'ecos-users.name': 'Name',
    // 'ecos-users.time-spent': 'Time spent',
    // 'elements': 'Elements',
    // 'filter': 'Filter',
    // 'load-button': 'Load',
    // 'pagination.next-page-label': 'Next',
    // 'pagination.next-page-title': 'Next page',
    // 'pagination.previous-page-label': 'Previous',
    // 'pagination.previous-page-title': 'Previous page',
    // 'search': 'Search',
    // 'select-button': 'Select',
    // 'selected-elements': 'Selected Elements',

    task: {
      bpm_description: {
        title: 'Task name'
      },
      statistics: {
        actual_perform_time: {
          title: 'Lead time, h'
        },
        completion_date: {
          title: 'Date of completion'
        },
        date: {
          title: 'Start date'
        },
        document: {
          title: 'Document'
        },
        expected_perform_time: {
          title: 'Expected lead time, h'
        },
        initiator: {
          title: 'Performer'
        },
        perform_time_ration: {
          title: 'Expected lead time / Lead time'
        },
        task_type: {
          title: 'Task type'
        }
      }
    },

    title: 'Journal'
  },

  journals: {
    action: {
      apply: 'Apply',
      'apply-template': 'Save changes',
      cancel: 'Cancel',
      'cancel-rename-tpl-msg': 'Cancel rename template',
      'create-template': 'Create template',
      delete: 'Delete',
      'delete-filter-group-msg': 'Delete filter group',
      'delete-filter-msg': 'Delete filter',
      'delete-records-msg': 'Delete records',
      'delete-tpl-msg': 'Delete template',
      'dialog-msg': 'Enter template name',
      'edit-dashlet': 'Dashlet editing',
      'hide-menu': 'Hide menu',
      'only-linked': 'Display only linked records',
      'remove-filter-group-msg': 'Remove filter group?',
      'remove-filter-msg': 'Remove filter?',
      'remove-records-msg': 'Do you really want to delete records?',
      'remove-tpl-msg': 'Remove template',
      'rename-tpl-msg': 'Rename template',
      reset: 'Reset',
      'reset-settings': 'Reset settings',
      save: 'Save',
      'select-journal': 'Select a journal',
      'select-journal-list': 'Select a list of journals',
      'setting-dialog-msg': 'Table settings',
      'show-menu': 'Show menu'
    },
    'columns-setup': {
      header: 'Columns setup'
    },
    'create-record-btn': 'Create',
    default: 'By default',
    'filter-list': {
      header: 'Journals'
    },
    grouping: {
      header: 'Grouping'
    },
    list: {
      name: 'Journals list'
    },
    name: 'Journals',
    settings: 'Settings',
    tpl: {
      defaults: 'Settings template'
    }
  },

  'filter-list': {
    'add-criterion': 'Add criterion',
    'add-operator': 'Add operator',
    'condition-group': 'Condition group',
    criterion: 'Criterion',
    'filter-group-add': 'Add',
    'panel-header': 'Filter'
  },

  'columns-setup': {
    ascending: 'Ascending',
    descending: 'Descending',
    order: 'Column order and display',
    sort: 'Sort by column'
  }
};

const common = {
  relative: {
    day: 'about a day ago',
    days: '{{value}} days ago',
    earlierThisWeek: 'Earlier this week',
    hour: 'about an hour ago',
    hours: '{{value}} hours ago',
    lastWeek: 'Last week',
    laterThisWeek: 'Later this week',
    minute: 'a minute ago',
    minutes: '{{value}} minutes ago',
    month: 'about a month ago',
    months: '{{value}} months ago',
    nextWeek: 'Next week',
    seconds: 'just now',
    today: 'Today',
    tomorrow: 'Tomorrow',
    year: 'about a year ago',
    years: 'over {{value}} years ago',
    yesterday: 'Yesterday'
  },

  size: {
    bytes: 'bytes',
    gigabytes: 'GB',
    kilobytes: 'KB',
    megabytes: 'MB'
  },

  search: {
    documents: 'Documents',
    label: 'Search files, people, sites',
    'no-results': 'Nothing found',
    people: 'People',
    placeholder: 'Search',
    'show-more-results': 'Show more results',
    sites: 'Sites',
    size: 'Size'
  },

  'page-tabs': {
    'bpmn-designer': 'Business process editor',
    'dashboard-settings': 'Page settings',
    'home-page': 'Home page',
    journal: 'Journal',
    'new-tab': 'New tab',
    'no-name': 'No name',
    'tab-name': 'Tab name'
  },

  predicate: {
    and: 'And',
    any: 'Any',
    'aspect-equals': 'Equals',
    'aspect-not-equals': 'Not equals',
    'assoc-contains': 'Contains',
    'assoc-empty': 'Is empty',
    'assoc-not-contains': 'Not contains',
    'assoc-not-empty': 'Is not empty',
    'boolean-empty': 'Is empty',
    'boolean-false': 'Is false',
    'boolean-not-empty': 'Is not empty',
    'boolean-true': 'Is true',
    contains: 'Contains',
    'date-empty': 'Is empty',
    'date-equals': 'Equals',
    'date-greater-or-equal': 'Greater or equals to',
    'date-less-or-equal': 'Less or equals to',
    'date-less-than': 'Less than',
    'date-not-empty': 'Is not empty',
    'date-not-equals': 'Not equals',
    empty: 'Is empty',
    ends: 'Ends with',
    eq: 'Equals',
    ge: 'Greater or equals to',
    gt: 'Greater than',
    le: 'Less or equals to',
    'list-equals': 'Equals',
    'list-not-equals': 'Not equals',
    lt: 'Less than',
    'noderef-contains': 'Contains',
    'noderef-empty': 'Is empty',
    'noderef-not-contains': 'Not contains',
    'noderef-not-empty': 'Is not empty',
    'not-contains': 'Not contains',
    'not-empty': 'Is not empty',
    'not-eq': 'Not equals',
    'number-equals': 'Equals to',
    'number-greater-or-equal': 'Greater or equals to',
    'number-greater-than': 'Greater than',
    'number-less-or-equal': 'Less or equals to',
    'number-less-than': 'Less than',
    'number-not-equals': 'Not equals to',
    or: 'Or',
    'path-child': 'Is contained directly in',
    'path-descendant': 'Is contained in',
    'path-equals': 'Equals',
    starts: 'Starts with',
    'string-contains': 'Contains',
    'string-empty': 'Is empty',
    'string-ends-with': 'Ends with',
    'string-equals': 'Equals',
    'string-not-empty': 'Is not empty',
    'string-not-equals': 'Not equals',
    'string-starts-with': 'Starts with',
    'type-equals': 'Equals',
    'type-not-equals': 'Not equals'
  }
};

export default {
  ...bpmnDesigner,
  ...header,
  ...journals,
  ...common
};
