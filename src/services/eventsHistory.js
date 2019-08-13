import { cellMsg, t } from '../helpers/util';

export default class EventsHistoryService {
  static config = {
    columns: [
      {
        attribute: 'event:date',
        formatter: 'DateTimeFormatter',
        text: t('dochist.header.date'),
        type: 'date'
      },
      {
        attribute: 'event:name',
        formatter: {
          name: 'FunctionFormatter',
          params: {
            fn: cellMsg('dochist.')
          }
        },
        text: t('dochist.header.name')
      },
      {
        attribute: 'event:documentVersion',
        text: t('dochist.header.version')
      },
      {
        dataField: 'event:initiator',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.person')
      },
      {
        attribute: 'taskOriginalOwner',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.fromName')
      },
      {
        attribute: 'event:taskRole',
        text: t('dochist.header.group')
      },
      {
        attribute: 'event:taskTitle',
        text: t('dochist.header.task')
      },
      {
        attribute: 'event:taskOutcomeTitle',
        text: t('dochist.header.outcome')
      },
      {
        attribute: 'event:taskComment',
        text: t('dochist.header.comment'),
        width: 230
      }
    ]
  };
}
