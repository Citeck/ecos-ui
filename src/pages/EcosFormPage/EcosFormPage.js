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
              {/* <EcosForm
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
*/}
              <br />
              <hr />
              <br />

              {/*<EcosForm
                record={'eform@ECOS_FORM'}
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
              />*/}

              <EcosForm
                record={'eform@ECOS_FORM'}
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
              <EcosForm
                record={'eform@02347243-639c-4da4-b261-8b47cbca2362'}
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
              <EcosForm
                record={'workspace://SpacesStore/a9b72c4e-9bfd-4767-882c-4f4e794adee5'}
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
