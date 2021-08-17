import React, { Component } from 'react';
import { FormGroup, Collapse, Alert, Table } from 'reactstrap';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';

import { EcosModal, Icon } from '../../common';
import { Input, Label } from '../../common/form';
import { getId, t } from '../../../helpers/util';
import { Btn } from '../../common/btns';
import { DateFormats } from '../../../constants';
import { settingsInfoExamples } from './utils';

const Labels = {
  CANCEL_BUTTON: 'btn.cancel.label',
  OK_BUTTON: 'btn.apply.label'
};

class Settings extends Component {
  static propTypes = {};

  static defaultProps = {
    title: 'Настройки виджета'
  };

  #key = getId();

  constructor(props) {
    super(props);

    this.state = {
      format: get(props, 'format', DateFormats.DATE),
      isOpenInfo: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { format } = this.state;

    if (isEqual(format, prevState.format) && !isEqual(prevProps.format, this.props.format)) {
      this.setState({ format: this.props.format });
    }
  }

  get formatElementId() {
    return `format-${this.#key}`;
  }

  handleChangeFormat = e => {
    const format = get(e, 'target.value', '');

    this.setState({ format });
  };

  handleToggleInfo = () => {
    this.setState(state => ({ isOpenInfo: !state.isOpenInfo }));
  };

  handleSaveSettings = () => {
    const { onSave } = this.props;
    const { format } = this.state;

    if (isFunction(onSave)) {
      onSave({ format });
    }
  };

  renderInfo() {
    const { isOpenInfo } = this.state;

    return (
      <Collapse isOpen={isOpenInfo}>
        <Alert color="info">
          {'Примеры формата данных для moment.js'}
          <br />
          <a href="https://momentjs.com/docs/#/parsing/string-format/" target="_blank" rel="noopener noreferrer">
            Подробнее
          </a>
        </Alert>

        <div className="ecos-current-task-settings__info-table">
          <Table striped bordered size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Input</th>
                <th>Example</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {settingsInfoExamples.map(item => (
                <tr>
                  <td className="text-right">{item.input}</td>
                  <td>{item.example}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Collapse>
    );
  }

  render() {
    const { title, isOpen, onHide } = this.props;
    const { format } = this.state;

    return (
      <EcosModal title={title} isOpen={isOpen} size="md" hideModal={onHide} className="ecos-current-task-settings">
        <FormGroup>
          <Label htmlFor={this.formatElementId}>
            {'Формат даты'}
            <Icon className="icon-question ecos-current-task-settings__info-icon" onClick={this.handleToggleInfo} />
          </Label>

          {this.renderInfo()}

          <Input id={this.formatElementId} value={format} onChange={this.handleChangeFormat} clear />
        </FormGroup>

        <FormGroup className="d-flex justify-content-end mb-0">
          <Btn onClick={onHide} className="mr-3">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleSaveSettings} className="ecos-btn_blue">
            {t(Labels.OK_BUTTON)}
          </Btn>
        </FormGroup>
      </EcosModal>
    );
  }
}

export default Settings;
