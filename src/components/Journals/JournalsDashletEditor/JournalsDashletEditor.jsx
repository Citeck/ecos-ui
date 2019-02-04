import React, { Component, Fragment } from 'react';
import classNames from 'classnames';

import Columns from '../../common/templates/Columns/Columns';
import { Caption, Select, Field } from '../../common/form';
import { Btn } from '../../common/btns';

import './JournalsDashletEditor.scss';

export default class JournalsDashletEditor extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('journal-dashlet-editor', props.className);

    return (
      <div className={cssClasses}>
        <div className={'journal-dashlet-editor__body'}>
          <Caption middle className={'journal-dashlet-editor__caption'}>
            Редактирование дашлета
          </Caption>

          <Field label={'Список журналов'}>
            <Select placeholder={'Договоры'} />
          </Field>

          <Field label={'Журнал'}>
            <Select placeholder={'Договоры'} />
          </Field>

          <Field label={'Настройки'}>
            <Select placeholder={'Мои настройки'} />
          </Field>
        </div>

        <Columns
          className={'journal-dashlet-editor__actions'}
          cols={[
            <Btn>Сбросить настройки</Btn>,

            <Fragment>
              <Btn className={'btn_x-step_10'}>Отмена</Btn>
              <Btn className={'btn_blue btn_hover_light-blue'}>Сохранить</Btn>
            </Fragment>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />
      </div>
    );
  }
}
