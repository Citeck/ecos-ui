import React from 'react';
import Select from '../../common/form/Select/Select';
import Textarea from '../../common/form/Textarea/Textarea';
import Label from '../../common/form/Label/Label';
import Input from '../../common/form/Input/Input';
import { Form, FormGroup } from 'reactstrap';

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' }
];

const ModelCreationForm = () => {
  return (
    <Form>
      <FormGroup>
        <Label>{'Название модели'}</Label>
        <Input type="text" placeholder='Например "Запрос справки"' />
      </FormGroup>

      <FormGroup>
        <Label>{'Выберите категорию'}</Label>
        <Select options={options} placeholder={'Мои модели'} />
      </FormGroup>

      <FormGroup>
        <Label>{'Доступ'}</Label>
        <Select options={options} placeholder={'Всем'} />
      </FormGroup>

      <FormGroup>
        <Label>{'Описание (не обязательно)'}</Label>
        <Textarea />
      </FormGroup>
    </Form>
  );
};

export default ModelCreationForm;
