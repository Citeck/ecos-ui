import moment from 'moment';

import { RecordService } from './recordService';
import { SourcesId } from '../constants';
import Records from '../components/Records';

function conditionByType(type) {
  switch (type) {
    case 'urgent': {
      return {
        att: 'bpm:dueDate',
        t: 'lt',
        val: moment().format('YYYY-MM-DD')
      };
    }
    case 'later': {
      return {
        val: [
          {
            att: 'ISNULL',
            val: 'bpm:dueDate',
            t: 'like'
          },
          {
            att: 'ISUNSET',
            val: 'bpm:dueDate',
            t: 'like'
          },
          {
            att: 'bpm:dueDate',
            t: 'gt',
            val: moment().format('YYYY-MM-DD')
          }
        ],
        t: 'or'
      };
    }
    default: {
      return {
        att: 'bpm:dueDate',
        t: 'like',
        val: moment().format('YYYY-MM-DD')
      };
    }
  }
}

export class ReportApi extends RecordService {
  getReportData = (type = 'urgent') =>
    Records.query(
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
                conditionByType(type)
              ],
              t: 'and'
            }
          ]
        },
        language: 'predicate',
        groupBy: ['wfm:documentEcosType', 'wfm:caseStatus']
      },
      {
        count: 'count',
        atts: 'groupAtts?json'
      }
    );
}
