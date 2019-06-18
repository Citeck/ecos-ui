import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { QUERY_KEYS } from '../constants';

const DEFAULT_KEY = 'key';
const PREFIX = 'uiserv/dashboard@';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = recordId => {
    recordId = recordId || '';

    return Records.get(`${PREFIX}${recordId}`)
      .load([QUERY_KEYS.CONFIG_JSON, QUERY_KEYS.KEY])
      .then(resp => resp);
  };

  saveDashboardConfig = ({ key, recordId, config }) => {
    recordId = recordId || '';
    const record = Records.get(`${PREFIX}${recordId}`);

    record.att(QUERY_KEYS.CONFIG_JSON, config);
    record.att(QUERY_KEYS.KEY, key || DEFAULT_KEY);

    return record.save().then(resp => resp);
  };

  getDashboardByRecordRef = function*(recordRef = '') {
    console.log('KU', recordRef);
    if (!recordRef) {
      return null;
    }

    const result = yield Records.get(recordRef).load('_dashboardKey[]');
    console.log('result', result);
    const dashboardIds = Array.from(result);
    let dashboard;

    dashboardIds.push('DEFAULT');

    for (let key of dashboardIds) {
      dashboard = yield Records.queryOne(
        {
          query: { key },
          sourceId: 'uiserv/dashboard'
        },
        { config: 'config?json' }
      );
      console.log('dashboard', dashboard);
      if (dashboard !== null) {
        break;
      }
    }

    return dashboard;
  };

  setDefaultConfig(config = null) {
    const defaultConfig = config || {
      layout: {
        type: '2-columns-big-small',
        columns: [
          {
            width: '60%',
            widgets: [
              {
                id: 'a857c687-9a83-4af4-83ed-58c3c9751e04',
                label: 'Предпросмотр',
                type: 'doc-preview',
                props: {
                  id: 'a857c687-9a83-4af4-83ed-58c3c9751e04',
                  config: {
                    height: '500px',
                    link: '/share/proxy/alfresco/demo.pdf',
                    scale: 1
                  }
                },
                style: {
                  height: '300px'
                }
              }
            ]
          },
          {
            width: '40%',
            widgets: [
              {
                id: '5a155e53-1932-4177-916d-dd12d2f53a3b',
                label: 'Журнал',
                type: 'journal'
              }
            ]
          }
        ]
      }
    };
    let record = Records.get('uiserv/dashboard@');

    record.att('config?json', defaultConfig);
    record.att('key', 'DEFAULT');
    record.save();
  }
}
