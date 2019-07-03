import { isArray, isEmpty } from 'lodash';
import { deepClone } from '../helpers/util';
import uuidV4 from 'uuid/v4';
import { ComponentKeys } from '../components/Components';

export default class DashboardService {
  static setDefaultPropsOfWidgets(items) {
    if (!isArray(items) || isEmpty(items)) {
      return [];
    }

    return items.map(item => {
      return item.map(widget => {
        const defWidget = deepClone(widget);
        const props = widget.props || {};
        const config = props.config || {};

        defWidget.id = widget.id || uuidV4();

        switch (defWidget.name) {
          case ComponentKeys.DOC_PREVIEW: {
            defWidget.props = {
              ...props,
              id: props.id || defWidget.id,
              config: {
                ...config,
                height: config.height || '500px',
                link: config.link || '/share/proxy/alfresco/demo.pdf',
                scale: config.scale || 1
              }
            };
            break;
          }
          case ComponentKeys.JOURNAL: {
            break;
          }
          default:
            break;
        }

        return defWidget;
      });
    });
  }
}
