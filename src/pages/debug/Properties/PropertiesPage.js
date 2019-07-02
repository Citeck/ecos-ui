import * as React from 'react';
import queryString from 'query-string';
import PropertiesDashlet from '../../../components/Properties/PropertiesDashlet';
import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getDocumentId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class PropertiesPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      // title: 'Свойства#' + nodeRef,
      config: {
        sourceId: 'wftask',
        height: '500px'
      }
    };
    const configs = [taskConfigUrl];

    const urlsCurrentUser = [];

    const urlsAdmin = [];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = getNodeRef(item);
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = 'Документ #' + id;
      template.id = id;
      template.config.sourceId = id;

      return template;
    };

    urlsCurrentUser.forEach(item => {
      configs.push(fillTask(item));
    });

    urlsAdmin.forEach(item => {
      configs.push(fillTask(item));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Демо страница виджета Свойства ({configs.length})</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col'}>
            {configs.map((item, index) => (
              <PropertiesDashlet id={item.id} document={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'} />
        </div>
      </div>
    );
  }
}
