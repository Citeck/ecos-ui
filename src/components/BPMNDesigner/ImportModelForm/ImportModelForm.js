import React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Col, Row } from 'reactstrap';
import Dropzone from 'react-dropzone';
import cn from 'classnames';
import { Btn } from '../../common/btns';
import { DatePicker, Label, Select } from '../../common/form';
import { hideModal } from '../../../actions/modal';
import { t } from '../../../helpers/util';
import { importProcessModelRequest } from '../../../actions/bpmn';
import { loadOrgStructUsers } from '../../../actions/misc';
import { selectCaseSensitiveCategories } from '../../../selectors/bpmn';
import './ImportModelForm.scss';

const mapStateToProps = state => ({
  categories: selectCaseSensitiveCategories(state),
  currentUser: state.user
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal()),
  importProcessModelRequest: payload => dispatch(importProcessModelRequest(payload)),
  loadOrgStructUsers: searchText => dispatch(loadOrgStructUsers(searchText))
});

const allowedExtensions = /(\.bpmn|\.bpmn20.xml)$/i;

class ImportModelForm extends React.Component {
  state = {
    author: null,
    owner: null,
    reviewers: [],
    category: '',
    acceptedFiles: [],
    validFrom: new Date(),
    validTo: null
  };

  componentDidMount() {
    const { categoryId, categories, currentUser, loadOrgStructUsers } = this.props;
    if (categories && categories.length > 0) {
      let selectedOption = categories[0];
      if (categoryId) {
        selectedOption = categories.find(item => item.value === categoryId);
      }

      const currentUserOption = { value: currentUser.nodeRef, label: currentUser.fullName };

      loadOrgStructUsers().then(result => {
        this.setState({
          author: currentUserOption,
          owner: currentUserOption,
          category: selectedOption,
          defaultOrgStructOptions: result
        });
      });
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    const { hideModal, importProcessModelRequest } = this.props;
    const { acceptedFiles, category, author, owner, reviewers, validFrom, validTo } = this.state;

    if (!category.value || acceptedFiles.length !== 1 || !author || !owner) {
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
          categoryId: category.value,
          author: author.value,
          owner: owner.value,
          reviewers: reviewers.map(item => item.value).join(','),
          validFrom: validFrom,
          validTo: validTo
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

  handleChangeAuthor = selectedOption => {
    this.setState({ author: selectedOption });
  };

  handleChangeOwner = selectedOption => {
    this.setState({ owner: selectedOption });
  };

  handleChangeReviewers = selectedOption => {
    this.setState({ reviewers: selectedOption });
  };

  handleChangeValidFrom = selectedOption => {
    this.setState({ validFrom: selectedOption });
  };

  handleChangeValidTo = selectedOption => {
    this.setState({ validTo: selectedOption });
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
    const { hideModal, categories, loadOrgStructUsers } = this.props;
    const { acceptedFiles, category } = this.state;
    const isSubmitButtonDisabled = !category || !acceptedFiles.length;

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
              className={'icon-small-close'}
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
          <Col md={6} sm={12}>
            <FormGroup>
              <Label>{t('bpmn-designer.create-bpm-form.author')}</Label>
              <Select
                loadOptions={loadOrgStructUsers}
                defaultOptions={this.state.defaultOrgStructOptions}
                value={this.state.author}
                onChange={this.handleChangeAuthor}
              />
            </FormGroup>
          </Col>
          <Col md={6} sm={12}>
            <FormGroup>
              <Label>{t('bpmn-designer.create-bpm-form.owner')}</Label>
              <Select
                loadOptions={loadOrgStructUsers}
                defaultOptions={this.state.defaultOrgStructOptions}
                value={this.state.owner}
                onChange={this.handleChangeOwner}
              />
            </FormGroup>
          </Col>
        </Row>

        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.reviewers')}</Label>
          <Select
            loadOptions={loadOrgStructUsers}
            defaultOptions={this.state.defaultOrgStructOptions}
            isMulti
            value={this.state.reviewers}
            onChange={this.handleChangeReviewers}
          />
        </FormGroup>

        <Row>
          <Col md={6} sm={12}>
            <FormGroup>
              <Label>{t('bpmn-designer.create-bpm-form.valid-from')}</Label>
              <DatePicker showIcon selected={this.state.validFrom} onChange={this.handleChangeValidFrom} />
            </FormGroup>
          </Col>
          <Col md={6} sm={12}>
            <FormGroup>
              <Label>{t('bpmn-designer.create-bpm-form.valid-to')}</Label>
              <DatePicker showIcon selected={this.state.validTo} onChange={this.handleChangeValidTo} />
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12} sm={12}>
            {uploadFileZone}
          </Col>
        </Row>

        <Row>
          <Col md={6} sm={12}>
            <Btn type="button" onClick={hideModal} className="ecos-btn_full-width">
              {t('bpmn-designer.import-bpm-form.cancel-btn')}
            </Btn>
          </Col>
          <Col md={6} sm={12}>
            <Btn disabled={isSubmitButtonDisabled} className="ecos-btn_full-width ecos-btn_blue">
              {t('bpmn-designer.import-bpm-form.submit-btn')}
            </Btn>
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
