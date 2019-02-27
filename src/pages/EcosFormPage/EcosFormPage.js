import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import EcosForm from '../../components/EcosForm';
import './temp.scss';

class EcosFormPage extends React.Component {
  render() {
    return (
      <Container>
        <Row>
          <Col md={12}>
            <div className={'white-container'}>
              <EcosForm
                record={'calendarEvent@'}
                onSubmit={e => {
                  console.log('Form submitted', e);
                }}
                onFormCancel={() => {
                  console.log('Form canceled');
                }}
                onReady={form => {
                  console.log('Form is ready', form);
                }}
              />

              <br />
              <hr />
              <br />

              <EcosForm
                record={'eform@a9322903-6e9f-4925-b833-85191552aa5d'}
                onSubmit={e => {
                  console.log('Form submitted', e);
                }}
                onFormCancel={() => {
                  console.log('Form canceled');
                }}
                onReady={form => {
                  console.log('Form is ready', form);
                }}
                // options={{
                //   readOnly: true,
                //   viewAsHtml: true
                // }}
              />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default EcosFormPage;
