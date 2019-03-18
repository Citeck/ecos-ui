import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import Form from 'formiojs/Form';
import FormBuilder from 'formiojs/FormBuilder';
import schema from './form.json';
// import schema from './calendarForm.json';
import '../../components/EcosForm/formio.full.min.css';
import '../../components/EcosForm/glyphicon-to-fa.scss';
import '../../forms/style.scss';
import './temp.scss';

// import SelectJournal from '../../components/common/form/SelectJournal';

import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';
import CustomComponents from '../../forms/components';
import { linkEditForms } from '../../forms/components/builder';
// console.log(DefaultComponents);
// console.log(CustomComponents);

linkEditForms(CustomComponents);
Components.setComponents({ ...DefaultComponents, ...CustomComponents });

class FormIOPage extends React.Component {
  componentDidMount() {
    let options = {
      // inputsOnly: true
    };

    // form in view mode
    if (0) {
      options = {
        readOnly: true,
        viewAsHtml: true
      };
    }

    const form = new Form(document.getElementById('formio'), schema, options);
    // console.log(form);

    form.render().then(form => {
      // console.log(form);

      // form.submission = {
      //   data: {
      //     firstName: 'Joe',
      //     lastName: 'Smith',
      //   }
      // };

      // Register for the submit event to get the completed submission.
      form.on('submit', function(submission) {
        console.log('Submission was made!', submission);
      });

      // Everytime the form changes, this will fire.
      form.on('change', function(changed) {
        console.log('Form was changed', changed);
      });

      form.on('error', function(error) {
        console.log('Form error', error);
      });
    });

    const formBuilder = new FormBuilder(document.getElementById('builder'), {});
    // console.log(formBuilder);
    formBuilder.render().then(form => {
      // console.log(form);

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
              {/*<SelectJournal />*/}

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
