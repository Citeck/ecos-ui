import React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, Col, Row } from 'reactstrap';
import Select from '../../common/form/Select/Select';
import Textarea from '../../common/form/Textarea/Textarea';
import Label from '../../common/form/Label/Label';
import Input from '../../common/form/Input/Input';
import Button from '../../common/form/Button/Button';
import { hideModal } from '../../../actions/modal';
import { saveProcessModelRequest } from '../../../actions/bpmn';

const mapStateToProps = state => ({
  categories: state.bpmn.categories.map(item => {
    return { value: item.id, label: item.label };
  })
});

const mapDispatchToProps = dispatch => ({
  hideModal: () => dispatch(hideModal()),
  saveProcessModelRequest: payload => dispatch(saveProcessModelRequest(payload))
});

class ModelCreationForm extends React.Component {
  state = {
    title: '',
    category: '',
    description: ''
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

  handleChangeTitle = e => {
    this.setState({ title: e.target.value });
  };

  handleChangeCategory = selectedOption => {
    this.setState({ category: selectedOption });
  };

  handleChangeDescription = e => {
    this.setState({ description: e.target.value });
  };

  handleSubmit = e => {
    e.preventDefault();

    const { hideModal, saveProcessModelRequest } = this.props;
    const title = this.state.title;
    const category = this.state.category.value;
    const description = this.state.description;

    if (title && category) {
      saveProcessModelRequest({
        title,
        categoryId: category,
        description
      });

      hideModal();
    }
  };

  render() {
    const { hideModal, categories } = this.props;

    // TODO use t()
    return (
      <Form onSubmit={this.handleSubmit}>
        <FormGroup>
          <Label>Название модели</Label>
          <Input value={this.state.title} onChange={this.handleChangeTitle} type="text" placeholder='Например "Запрос справки"' />
        </FormGroup>

        <FormGroup>
          <Label>Выберите категорию</Label>
          <Select value={this.state.category} onChange={this.handleChangeCategory} options={categories} />
        </FormGroup>

        {/*<FormGroup>*/}
        {/*<Label>{'Доступ'}</Label>*/}
        {/*<Select options={options} placeholder={'Всем'} />*/}
        {/*</FormGroup>*/}

        <FormGroup>
          <Label>Описание (не обязательно)</Label>
          <Textarea value={this.state.description} onChange={this.handleChangeDescription} />
        </FormGroup>

        <Row>
          <Col md={6} sm={12}>
            <Button type="button" onClick={hideModal} className="button_light button_full_width">
              Отмена
            </Button>
          </Col>
          <Col md={6} sm={12}>
            <Button className="button_full_width">Создать модель</Button>
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
