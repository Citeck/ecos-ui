import moment from 'moment';

import { RecordService } from './recordService';
import { SourcesId } from '../constants';
import Records from '../components/Records';

const checkByType = {
  urgent: 'lt',
  today: 'like',
  later: 'gt'
};

export class ReportApi extends RecordService {
  getReportData = (type = 'urgent') => {
    return Records.query(
      {
        sourceId: SourcesId.REPORT,
        query: {
          t: 'and',
          val: [
            {
              val: [
                {
                  att: 'TYPE',
                  val: '{http://www.alfresco.org/model/bpm/1.0}task',
                  t: 'eq'
                },
                {
                  att: '_actors',
                  val: '$CURRENT',
                  t: 'eq'
                },
                {
                  val: [
                    {
                      att: 'ISNULL',
                      val: 'bpm:completionDate',
                      t: 'like'
                    },
                    {
                      att: 'ISUNSET',
                      val: 'bpm:completionDate',
                      t: 'like'
                    }
                  ],
                  t: 'or'
                },
                {
                  att: 'bpm:dueDate',
                  t: checkByType[type],
                  val: moment().format('YYYY-MM-DD')
                }
              ],
              t: 'and'
            }
          ]
        },
        language: 'predicate',
        groupBy: ['wfm:documentType', 'wfm:caseStatus']
      },
      {
        count: 'count',
        atts: 'groupAtts?json'
      }
    );
  };
}
