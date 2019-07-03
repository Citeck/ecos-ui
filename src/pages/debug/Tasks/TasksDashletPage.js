import * as React from 'react';
import queryString from 'query-string';
import TasksDashlet from '../../../components/Tasks';
import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getDocumentId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class TasksDashletPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      config: {
        height: '500px'
      }
    };
    const configs = [taskConfigUrl];

    const urls = ['?nodeRef=workspace://SpacesStore/5409bdbc-d3bf-4661-8e1d-58ef1fd8a1fa'];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = getNodeRef(item);
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = 'Документ #' + id;
      template.id = id;

      return template;
    };

    urls.forEach(item => {
      configs.push(fillTask(item));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Демо страница виджетов Задачи ({configs.length + col2.length})</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col'}>
            {configs.map((item, index) => (
              <TasksDashlet id={item.id} document={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            {/*{col2.map((item, index) => (
              <Tasks document={item.document} {...item.config} key={item.id + index} />
            ))}*/}
          </div>
        </div>
      </div>
    );
  }
}
