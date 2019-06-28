import * as React from 'react';
import queryString from 'query-string';
import TasksDashlet from '../../../components/Tasks/TasksDashlet';
import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getSourceId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class TasksDashletPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getSourceId(nodeRef),
      document: nodeRef,
      // document: undefined,
      title: undefined,
      config: {
        sourceId: getSourceId(nodeRef),
        height: '500px'
      }
    };
    const configs = [taskConfigUrl];

    const urlsMmtr = [
      '?nodeRef=workspace://SpacesStore/fb4e30d7-ee35-45e9-88ec-2497d550b84c',
      // '?nodeRef=workspace://SpacesStore/f3193da4-e251-4b1e-aaeb-06a862fbd130',
      // '?nodeRef=workspace://SpacesStore/65e4b0b2-238b-49b9-ab16-3238bc3c8d0f',
      // '?nodeRef=workspace://SpacesStore/a331c982-693d-45fd-93c6-59ba22ca8deb',
      // '?nodeRef=workspace://SpacesStore/01b07a53-3b6d-40ce-9093-043ac5f56a14',
      // '?nodeRef=workspace://SpacesStore/adc80a0f-d665-4f64-87ab-472da1227ab2',
      '?nodeRef=workspace://SpacesStore/bcaf28dc-e3ba-4a17-9371-21b2d9419ef1'
    ];

    const urlsAdmin = [
      '?nodeRef=workspace://SpacesStore/fb4e30d7-ee35-45e9-88ec-2497d550b84c'
      // '?nodeRef=workspace://SpacesStore/f3193da4-e251-4b1e-aaeb-06a862fbd130',
      // '?nodeRef=workspace://SpacesStore/65e4b0b2-238b-49b9-ab16-3238bc3c8d0f',
      // '?nodeRef=workspace://SpacesStore/a331c982-693d-45fd-93c6-59ba22ca8deb',
      // '?nodeRef=workspace://SpacesStore/037e26eb-0435-4fd7-96c2-828108444adf',
      // '?nodeRef=workspace://SpacesStore/97457e4e-e540-4eeb-b0e3-dc05392e4643',
      // '?nodeRef=workspace://SpacesStore/bd689669-aca3-47ac-83da-ec14ef788b39',
      // '?nodeRef=workspace://SpacesStore/9032a11b-a3b8-4479-a51f-232998a7e07a',
      // '?nodeRef=workspace://SpacesStore/dcbc3057-fb87-40ec-ab46-2c7a6b63b241',
      // '?nodeRef=workspace://SpacesStore/c6e32bd2-2583-4e40-bcca-e46f301d6658',
      // '?nodeRef=workspace://SpacesStore/de2a676b-323e-427b-ab35-650caafde4f1',
      // '?nodeRef=workspace://SpacesStore/d0953400-e883-4655-a7c7-88d403e52ddf',
      // '?nodeRef=workspace://SpacesStore/a331c982-693d-45fd-93c6-59ba22ca8deb',
      // '?nodeRef=workspace://SpacesStore/73cee786-42b9-452f-9061-3506d8cbebc3',
      // '?nodeRef=workspace://SpacesStore/9d62cd4d-8288-4e92-a12e-ba2fb8c14fb5'
    ];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = getNodeRef(item);
      const id = getSourceId(nodeRef);

      template.document = nodeRef;
      template.title = 'Список задач № ' + id;
      template.id = id;
      template.config.sourceId = id;

      return template;
    };

    urlsMmtr.forEach(item => {
      configs.push(fillTask(item));
    });

    urlsAdmin.forEach(item => {
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
            {col2.map((item, index) => (
              <TasksDashlet id={item.id} document={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
