import * as React from 'react';
import queryString from 'query-string';
import { get, split } from 'lodash';
import { deepClone } from '../../helpers/util';
import Row from 'reactstrap/es/Row';
import Container from 'reactstrap/es/Container';
import Col from 'reactstrap/es/Col';
import ActionsDashlet, { Actions } from '../../components/Actions';

import './testStyle.scss';

const getNodeRef = url => get(queryString.parse(url), 'recordRef', {});
const getDocumentId = nodeRef => get(split(nodeRef, 'workspace://SpacesStore/'), '1');

export default class RecordActionsPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined
    };
    const configs = [taskConfigUrl];

    const urls = [
      'workspace://SpacesStore/f3a03c6c-cb8a-41a5-9d06-52571d5f421c',
      'workspace://SpacesStore/b7df6e91-d366-4c99-a938-e96cf80dbbbe'
    ];

    const fill = ref => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = ref;
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = '';
      template.id = id;

      return template;
    };

    urls.forEach(ref => {
      configs.push(fill(ref));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <Container fluid className="ecos-debug-bs">
        <Row className="justify-content-md-center">
          <h3>Demo Actions</h3>
        </Row>
        <Row className="justify-content-md-center">
          <Col sm lg="2">
            <h5>Widget Small</h5>
            {configs.map((item, index) => (
              <ActionsDashlet
                id={item.id}
                record={item.document}
                config={item.config}
                title={item.title}
                key={`action1${item.id}${index}`}
              />
            ))}
          </Col>
          <Col sm lg="6">
            <h5>Widget Large</h5>
            {col2.map((item, index) => (
              <ActionsDashlet
                id={item.id}
                record={item.document}
                config={item.config}
                title={item.title}
                key={`action2${item.id}${index}`}
              />
            ))}
          </Col>
          <Col sm lg="4">
            <h5>Solo</h5>
            {col2.map((item, index) => (
              <Actions record={item.document} {...item.config} key={item.id + index} stateId={`action3${index}`} />
            ))}
          </Col>
        </Row>
      </Container>
    );
  }
}
