import React from "react";
import PropTypes from "prop-types";
import { FormGroup, Collapse, Alert, Table, FormText } from "reactstrap";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import isFunction from "lodash/isFunction";
import moment from "moment";

import { EcosModal, Icon } from "../../common";
import { Input, Label } from "../../common/form";
import { getId, t } from "../../../helpers/util";
import { Btn } from "../../common/btns";
import { DateFormats } from "../../../constants";
import { isValidDateFormat, settingsInfoExamples } from "./utils";

const Labels = {
  WIDGET_NAME: "current-tasks-widget.title",
  WIDGET_LABEL: "widget-settings.title",
  CANCEL_BUTTON: "btn.cancel.label",
  OK_BUTTON: "btn.apply.label",
  EXAMPLE_DATE_FORMAT: "current-tasks-widget.settings.example-format",
  DATE_FORMAT_TITLE: "current-tasks-widget.settings.date-format.title",
  MORE_LABEL: "current-tasks-widget.settings.info.more.label",
  INFO_DESCRIPTION: "current-tasks-widget.settings.info.description",
  INVALID_FORMAT: "current-tasks-widget.settings.invalid-format"
};

class Settings extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    settings: PropTypes.object,
    onHide: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {
    settings: {}
  };

  #key = getId();

  constructor(props) {
    super(props);

    const initialDateFormat = get(props, "settings.dateFormat", DateFormats.DATE);

    this.state = {
      dateFormat: initialDateFormat,
      isValidDateFormat: isValidDateFormat(initialDateFormat),
      isOpenInfo: false,
      exampleText: this.makeExampleText(initialDateFormat)
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { settings } = this.props;
    const { dateFormat } = this.state;

    if (isEqual(dateFormat, prevState.dateFormat) && !isEqual(prevProps.settings.dateFormat, settings.dateFormat)) {
      this.setState({ dateFormat: settings.dateFormat });
    }
  }

  get formatElementId() {
    return `format-${this.#key}`;
  }

  makeExampleText(dateFormat) {
    return moment().format(dateFormat);
  }

  handleChangeFormat = e => {
    const dateFormat = get(e, "target.value", "");
    const isValid = isValidDateFormat(dateFormat);
    this.setState({ dateFormat, isValidDateFormat: isValid });
  };

  handleToggleInfo = () => {
    this.setState(state => ({ isOpenInfo: !state.isOpenInfo }));
  };

  handleSaveSettings = () => {
    const { onSave } = this.props;
    const { dateFormat, isValidDateFormat } = this.state;

    if (isFunction(onSave) && isValidDateFormat) {
      onSave({ dateFormat });
    }
  };

  renderInfo() {
    const { isOpenInfo } = this.state;

    return (
      <Collapse isOpen={isOpenInfo}>
        <Alert color="info">
          {t(Labels.INFO_DESCRIPTION)}
          <br />
          <a href="https://momentjs.com/docs/#/parsing/string-format/" target="_blank" rel="noopener noreferrer">
            {t(Labels.MORE_LABEL)}
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
                <tr key={item.input}>
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
    const { isOpen, onHide } = this.props;
    const { dateFormat, isValidDateFormat, exampleText } = this.state;

    return (
      <EcosModal
        title={t(Labels.WIDGET_LABEL, { title: t(Labels.WIDGET_NAME) })}
        isOpen={isOpen}
        size="md"
        hideModal={onHide}
        className="ecos-current-task-settings"
      >
        <FormGroup>
          <Label htmlFor={this.formatElementId}>
            {t(Labels.DATE_FORMAT_TITLE)}
            <Icon className="icon-question ecos-current-task-settings__info-icon" onClick={this.handleToggleInfo} />
          </Label>

          {this.renderInfo()}

          <Input
            id={this.formatElementId}
            value={dateFormat}
            isValid={isValidDateFormat}
            onChange={this.handleChangeFormat}
            clear
            needValidCheck={true}
          />
          <FormText color="muted" className={!isValidDateFormat ? "ecos-current-task-settings__invalid-date-format" : ""}>
            {t(Labels.EXAMPLE_DATE_FORMAT, { format: exampleText })}
          </FormText>
        </FormGroup>

        <FormGroup className="d-flex justify-content-end mb-0">
          <Btn onClick={onHide} className="mr-3">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleSaveSettings} className="ecos-btn_blue" disabled={!isValidDateFormat}>
            {t(Labels.OK_BUTTON)}
          </Btn>
        </FormGroup>
      </EcosModal>
    );
  }
}

export default Settings;
