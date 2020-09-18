import ActionsExecutor from '../../ActionsExecutor';
import { goToJournalsPage } from '../../../../../../helpers/urls';

/**
 * @deprecated should be removed after js-modules will be developed
 */
export default class MoveToLinesJournal extends ActionsExecutor {
  static ACTION_ID = 'move-to-lines';

  async execForRecord(record, action, context) {
    let recordId = record.id;

    record.load('skifem:eventTypeAssoc.skifdm:eventTypeId?str').then(eventType => {
      goToJournalsPage({
        journalsListId: 'site-ssg-skif-main',
        journalId: 'event-lines-' + eventType,
        filter: JSON.stringify({
          t: 'eq',
          att: 'skifem:eventRef',
          val: recordId
        })
      });
    });

    return false;
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-new-tab'
    };
  }
}
