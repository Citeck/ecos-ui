import React from 'react';
import Select from '../../common/form/Select/Select';
import Textarea from '../../common/form/Textarea/Textarea';
import Label from '../../common/form/Label/Label';
import Input from '../../common/form/Input/Input';
import { Form, FormGroup } from 'reactstrap';
import Button from '../../common/form/Button/Button';

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
      <Button className={'button_light button_float_left'}>{'Отмена'}</Button>
      <Button className={'button_float_right'}>{'Создать модель'}</Button>
    </Form>
  );
};

export default ModelCreationForm;
