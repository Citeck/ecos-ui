import React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Col, Row } from 'reactstrap';
import Dropzone from 'react-dropzone';
import cn from 'classnames';
import { Button, Label, Select } from '../../common/form';
import { hideModal } from '../../../actions/modal';
import { t } from '../../../helpers/util';
import { importProcessModelRequest } from '../../../actions/bpmn';
import './ImportModelForm.scss';

const mapStateToProps = state => ({
  categories: state.bpmn.categories.map(item => {
    return { value: item.id, label: item.label };
  })
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal()),
  importProcessModelRequest: payload => dispatch(importProcessModelRequest(payload))
});

const allowedExtensions = /(\.bpmn|\.bpmn20.xml)$/i;

class ImportModelForm extends React.Component {
  state = {
    category: '',
    acceptedFiles: []
  };

  componentDidMount() {
    const { categoryId, categories } = this.props;
    if (categories && categories.length > 0) {
      let selectedOption = categories[0];
      if (categoryId) {
        selectedOption = categories.find(item => item.value === categoryId);
      }

      this.setState({ category: selectedOption });
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    const { hideModal, importProcessModelRequest } = this.props;
    const { acceptedFiles } = this.state;
    const category = this.state.category.value;

    if (!category || acceptedFiles.length !== 1) {
      // TODO
      return null;
    }

    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileAsBinaryString = reader.result;
        // console.log('fileAsBinaryString', fileAsBinaryString);

        importProcessModelRequest({
          content: fileAsBinaryString,
          categoryId: category
        });

        hideModal();
      };
      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');

      reader.readAsText(file);
    });
  };

  onDrop = (acceptedFiles, rejectedFiles) => {
    // console.log('acceptedFiles', acceptedFiles);
    // console.log('rejectedFiles', rejectedFiles);

    this.setState({
      acceptedFiles: acceptedFiles.filter(item => {
        return !!allowedExtensions.exec(item.name);
      })
    });
  };

  renderDropZone = ({ getRootProps, getInputProps, isDragActive }) => {
    return (
      <div {...getRootProps()} className={cn('dropzone', { dropzone_active: isDragActive })}>
        <input {...getInputProps()} name="att_cm:content" />
        <p>{t('bpmn-designer.import-bpm-dialog.dropzone-text')}</p>
      </div>
    );
  };

  handleChangeCategory = selectedOption => {
    this.setState({ category: selectedOption });
  };

  deleteAcceptedFile = idx => {
    this.setState(prevState => {
      console.log(prevState.acceptedFiles);
      return {
        acceptedFiles: []
      };
    });
  };

  render() {
    const { hideModal, categories } = this.props;
    const { acceptedFiles } = this.state;

    let uploadFileZone = (
      <Dropzone
        // accept={['text/xml'] /* TODO */}
        // maxSize TODO
        multiple={false}
        onDrop={this.onDrop}
      >
        {this.renderDropZone}
      </Dropzone>
    );

    if (acceptedFiles.length > 0) {
      uploadFileZone = acceptedFiles.map((item, idx) => {
        return (
          <div key={idx} className="dropzone__accepted-files">
            {item.name}
            <span
              className={'icon-close'}
              onClick={() => {
                this.deleteAcceptedFile(idx);
              }}
            />
          </div>
        );
      });
    }

    return (
      <Form onSubmit={this.handleSubmit}>
        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.category')}</Label>
          <Select value={this.state.category} onChange={this.handleChangeCategory} options={categories} name="att_ecosbpm:category" />
        </FormGroup>

        <Row>
          <Col md={12} sm={12}>
            {uploadFileZone}
          </Col>
        </Row>

        <Row>
          <Col md={6} sm={12}>
            <Button type="button" onClick={hideModal} className="button_full_width">
              {t('bpmn-designer.import-bpm-form.cancel-btn')}
            </Button>
          </Col>
          <Col md={6} sm={12}>
            <Button className="button_full_width button_blue">{t('bpmn-designer.import-bpm-form.submit-btn')}</Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportModelForm);
