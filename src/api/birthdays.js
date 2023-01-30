import { RecordService } from './recordService';
import { SourcesId } from '../constants';
import Records from '../components/Records';

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
        query: { t: 'and', v: predicates },
        sortBy: [{ attribute: 'birthDate', ascending: true }]
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
