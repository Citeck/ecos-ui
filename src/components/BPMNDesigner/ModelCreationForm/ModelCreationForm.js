import React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Col, Row } from 'reactstrap';
import Button from '../../common/buttons/Button/Button';
import { Input, Label, Select, Textarea } from '../../common/form';
import { hideModal } from '../../../actions/modal';
import { saveProcessModelRequest } from '../../../actions/bpmn';
import { loadOrgStructUsers } from '../../../actions/misc';
import { t } from '../../../helpers/util';

const mapStateToProps = state => ({
  categories: state.bpmn.categories.map(item => {
    return { value: item.id, label: item.label };
  }),
  currentUser: state.user
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal()),
  saveProcessModelRequest: payload => dispatch(saveProcessModelRequest(payload)),
  loadOrgStructUsers: searchText => dispatch(loadOrgStructUsers(searchText))
});

// TODO: Valid form, Valid to
// TODO: add translation messages
// TODO: refactoring

class ModelCreationForm extends React.Component {
  state = {
    author: null,
    processOwner: null,
    reviewers: [],
    title: '',
    processKey: '',
    category: '',
    description: '',
    defaultOrgStructOptions: []
  };

  componentDidMount() {
    const { categoryId, categories, currentUser, loadOrgStructUsers } = this.props;
    if (categories && categories.length > 0) {
      let selectedOption = categories[0];
      if (categoryId) {
        selectedOption = categories.find(item => item.value === categoryId);
      }

      const currentUserOption = { value: currentUser.nodeRef, label: currentUser.fullName };

      this.setState({
        author: currentUserOption,
        processOwner: currentUserOption,
        category: selectedOption
      });

      loadOrgStructUsers().then(result => {
        this.setState({
          defaultOrgStructOptions: result
        });
      });
    }
  }

  handleChangeTitle = e => {
    this.setState({ title: e.target.value });
  };

  handleChangeProcessKey = e => {
    this.setState({ processKey: e.target.value });
  };

  handleChangeCategory = selectedOption => {
    this.setState({ category: selectedOption });
  };

  handleChangeAuthor = selectedOption => {
    this.setState({ author: selectedOption });
  };

  handleProcessOwner = selectedOption => {
    this.setState({ processOwner: selectedOption });
  };

  handleChangeReviewers = selectedOption => {
    this.setState({ reviewers: selectedOption });
  };

  handleChangeDescription = e => {
    this.setState({ description: e.target.value });
  };

  handleSubmit = e => {
    e.preventDefault();

    const { hideModal, saveProcessModelRequest } = this.props;
    const title = this.state.title;
    const processKey = this.state.processKey;
    const category = this.state.category.value;
    const description = this.state.description;

    if (title && processKey && category) {
      saveProcessModelRequest({
        title,
        processKey,
        categoryId: category,
        description
      });

      hideModal();
    }
  };

  render() {
    const { hideModal, categories, loadOrgStructUsers } = this.props;
    const { title, processKey, category } = this.state;
    const isSubmitButtonDisabled = !title || !processKey || !category;

    return (
      <Form onSubmit={this.handleSubmit}>
        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.title')}</Label>
          <Input
            value={this.state.title}
            onChange={this.handleChangeTitle}
            type="text"
            placeholder={t('bpmn-designer.create-bpm-form.title-placeholder')}
          />
        </FormGroup>

        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.process-key')}</Label>
          <Input
            value={this.state.processKey}
            onChange={this.handleChangeProcessKey}
            type="text"
            placeholder={t('bpmn-designer.create-bpm-form.process-key-placeholder')}
          />
        </FormGroup>

        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.category')}</Label>
          <Select value={this.state.category} onChange={this.handleChangeCategory} options={categories} />
        </FormGroup>

        <FormGroup>
          <Label>{t('bpmn-designer.create-bpm-form.description')}</Label>
          <Textarea value={this.state.description} onChange={this.handleChangeDescription} />
        </FormGroup>

        <Row>
          <Col md={6} sm={12}>
            <FormGroup>
              <Label>{t('Author')}</Label>
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
              <Label>{t('Process owner')}</Label>
              <Select
                loadOptions={loadOrgStructUsers}
                defaultOptions={this.state.defaultOrgStructOptions}
                value={this.state.processOwner}
                onChange={this.handleProcessOwner}
              />
            </FormGroup>
          </Col>
        </Row>

        <FormGroup>
          <Label>{t('Reviewers')}</Label>
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
            <Button type="button" onClick={hideModal} className="button_full_width">
              {t('bpmn-designer.create-bpm-form.cancel-btn')}
            </Button>
          </Col>
          <Col md={6} sm={12}>
            <Button disabled={isSubmitButtonDisabled} className="button_full_width button_blue">
              {t('bpmn-designer.create-bpm-form.submit-btn')}
            </Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModelCreationForm);
