import React from 'react';
import { Col, Container, Row } from 'reactstrap';
// import Form from 'formiojs/Form';
import FormBuilder from 'formiojs/FormBuilder';
// import schema from './form.json';
// import schema from './calendarForm.json';
// import schema from './contractor.json';
import '../../../forms';
// import Formio from 'formiojs/Formio';
import './temp.scss';

class FormIOPage extends React.Component {
  componentDidMount() {
    // let proxyUri = ((window.Alfresco || {}).constants || {}).PROXY_URI || '/';
    // proxyUri = proxyUri.substring(0, proxyUri.length - 1);
    // Formio.setProjectUrl(proxyUri);
    //
    // let options = {
    //   // inputsOnly: true
    // };
    // // form in view mode
    // if (1) {
    //   options = {
    //     readOnly: true,
    //     viewAsHtml: true,
    //     fullWidthColumns: true,
    //     viewAsHtmlConfig: {
    //       // hidePanels: true
    //     }
    //   };
    // }
    //
    // const form = new Form(document.getElementById('formio'), schema, options);
    //
    // form.render().then(form => {
    //   // console.log(form);
    //
    //   // form.submission = {
    //   //   data: {
    //   //     legalEntities: [
    //   //       'workspace://SpacesStore/99ce5ecc-a501-404c-a1ed-5507afed6282',
    //   //       'workspace://SpacesStore/50a4ace5-925a-4267-905f-abeff3960d1c'
    //   //     ],
    //   //     // 'idocs_initiator': "workspace://SpacesStore/2d2cc237-6d4c-4904-b60d-0e2d64a67877",
    //   //     idocs_initiator: [
    //   //       'workspace://SpacesStore/0e496fc3-1fbd-4d15-ab9b-b3bc011af0c6',
    //   //       'workspace://SpacesStore/c04050a9-2f30-417e-a099-5b2753a5efb4'
    //   //     ],
    //   //     lastName: 'Smith'
    //   //   }
    //   // };
    //
    //   // Register for the submit event to get the completed submission.
    //   form.on('submit', function(submission) {
    //     console.log('Submission was made!', submission);
    //   });
    //
    //   // Everytime the form changes, this will fire.
    //   form.on('change', function(changed) {
    //     console.log('Form was changed', changed);
    //   });
    //
    //   form.on('error', function(error) {
    //     console.log('Form error', error);
    //   });
    // });

    const formBuilder = new FormBuilder(document.getElementById('builder'), {});

    formBuilder.render().then(form => {
      // Everytime the form changes, this will fire.
      form.on('change', function(changed) {
        console.log('Builder form was changed', changed);
      });
    });
  }

  render() {
    return (
      <Container>
        <Row>
          <Col md={12}>
            <div className={'white-container'}>
              <div id="formio" />
              <br />
              <hr />
              <br />
              <div id="builder" />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default FormIOPage;
