import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '../components/Journals/service/util';
import OrgstructEditor from '../components/Journals/service/editors/registry/OrgstructEditor';
import { AUTHORITY_TYPE_USER } from '../components/common/form/SelectOrgstruct/constants';
import DateTimeEditor from '../components/Journals/service/editors/registry/DateTimeEditor';
import { cellMsg, t } from '../helpers/util';

export default class EventsHistoryService {
  static defaultJournal = 'history-records-widget';

  /**
   * @deprecated Use journal config
   */
  static config = {
    columns: [
      {
        attribute: 'event:date',
        formatter: {
          name: 'DateTimeFormatter',
          params: {
            format: 'DD.MM.YYYY HH:mm:ss'
          }
        },
        text: t('dochist.header.date'),
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.DATETIME,
        newEditor: {
          config: {},
          type: DateTimeEditor.TYPE
        }
      },
      {
        attribute: 'event:name',
        formatter: {
          name: 'FunctionFormatter',
          params: {
            fn: cellMsg('dochist.')
          }
        },
        text: t('dochist.header.name'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:documentVersion',
        text: t('dochist.header.version'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        dataField: 'event:initiator',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.person'),
        newEditor: {
          config: {
            allowedAuthorityTypes: AUTHORITY_TYPE_USER
          },
          type: OrgstructEditor.TYPE
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.AUTHORITY
      },
      {
        attribute: 'taskOriginalOwner',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.fromName'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskRole',
        text: t('dochist.header.group'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskTitle',
        text: t('dochist.header.task'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskOutcomeTitle',
        text: t('dochist.header.outcome'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskComment',
        text: t('dochist.header.comment'),
        className: 'event-cell-task-comment',
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      }
    ]
  };
}
