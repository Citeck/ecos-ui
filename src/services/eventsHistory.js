import { t } from '../helpers/util';
import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '../components/Journals/service/util';
import { EmodelTypes, SourcesId } from '../constants';
import { PREDICATE_EQ } from '../components/Records/predicates/predicates';

export default class EventsHistoryService {
  static config = {
    columns: [
      {
        attribute: 'creationTime',
        text: t('dochist.header.date'),
        searchable: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.DATETIME,
        newFormatter: {
          type: 'datetime',
          config: { format: 'DD.MM.YYYY HH:mm:ss' }
        }
      },
      {
        attribute: 'document.version',
        text: t('dochist.header.version'),
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'eventType',
        text: t('dochist.header.name'),
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.person'),
        attribute: 'username',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.fromName'),
        attribute: 'document.owner',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.outcome'),
        attribute: 'taskTitle',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.group'),
        attribute: 'taskRole',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.outcome'),
        attribute: 'taskOutcomeName',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        text: t('dochist.header.comment'),
        attribute: 'comments',
        searchable: true,
        searchableByText: true,
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      }
    ],
    sourceId: SourcesId.HISTORY_REC,
    predicate: { att: '_type', val: EmodelTypes.HISTORY_REC, t: PREDICATE_EQ }
  };
}
