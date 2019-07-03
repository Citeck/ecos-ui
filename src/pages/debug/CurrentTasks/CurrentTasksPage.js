import * as React from 'react';
import queryString from 'query-string';
//import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getDocumentId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class CurrentTasksPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      // title: 'Текущие задачи #' + nodeRef,
      config: {
        height: '500px'
      }
    };
    const configs = [taskConfigUrl];

    const params = ['?nodeRef=workspace://SpacesStore/ee3a3405-1cd6-430d-8f4f-c614e020dc17'];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = getNodeRef(item);
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = 'Текущие задачи #' + id;
      template.id = id;
      template.config.sourceId = id;

      return template;
    };

    params.forEach(item => {
      configs.push(fillTask(item));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Демо страница виджета Свойства ({configs.length})</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col'}>
            {configs.map((item, index) => (
              <div id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            {col2.map((item, index) => (
              <div id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
