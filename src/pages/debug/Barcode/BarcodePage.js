import * as React from 'react';
import queryString from 'query-string';
import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';
import BarcodeDashlet, { Barcode } from '../../../components/Barcode';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getDocumentId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class BarcodePage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      // title: 'Свойства #' + nodeRef,
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
      template.title = 'Свойства #' + id;
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
        <h3>Демо страница Штрих-код ({configs.length})</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col'}>
            <h5>Widget Barcode</h5>
            {configs.map((item, index) => (
              <BarcodeDashlet id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            <h5>Solo Barcode</h5>
            {col2.map((item, index) => (
              <Barcode record={item.document} {...item.config} key={item.id + index} stateId={'props' + index} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
