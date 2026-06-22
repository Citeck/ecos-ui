import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';

import { RecordService } from './recordService';

export class BirthdaysApi extends RecordService {
  getBirthdays = ({ start, end }) => {
    const predicates = [
      {
        t: 'or',
        v: [
          {
            t: 'eq',
            a: 'personDisabled',
            v: false
          },
          {
            t: 'empty',
            a: 'personDisabled'
          }
        ]
      }
    ];

    if (start) {
      predicates.push({
        t: 'ge',
        a: 'birthMonthDay',
        v: start
      });
    }

    if (end) {
      predicates.push({
        t: 'le',
        a: 'birthMonthDay',
        v: end
      });
    }

    return Records.query(
      {
        sourceId: SourcesId.PERSON,
        language: 'predicate',
        query: { t: 'and', v: predicates }
      },
      {
        id: 'id',
        userName: '?localId',
        firstName: 'firstName',
        lastName: 'lastName',
        middleName: 'middleName',
        displayName: '?disp',
        birthDay: 'birthDate',
        avatarUrl: 'avatar.url'
      }
    );
  };
}
