import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'reactstrap';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';

import DisplayElementService from '../../../services/DisplayElementService';
import { objectCompare, t } from '../../../helpers/util';
import { InfoText } from '../../common';
import { Input, Label, Select, Textarea } from '../../common/form';
import { Btn } from '../../common/btns';

const Labels = {
  DONE_BUTTON: 'btn.done.label',
  CANCEL_BUTTON: 'btn.cancel.label',
  DISPLAY_CONDITION_TITLE: 'widget.display-condition.element-title',
  DISPLAY_CONDITION_ERR: 'widget.display-condition.error.invalid',
  CODE_TYPE: 'barcode-widget.settings.code-type.label',
  PRINT_SET: 'barcode-widget.settings.print-settings.label',
  SCALE: 'barcode-widget.settings.scale.label',
  MARGINS: 'barcode-widget.settings.margins.label',
  LEFT: 'barcode-widget.settings.margin-left.label',
  RIGHT: 'barcode-widget.settings.margin-right.label',
  TOP: 'barcode-widget.settings.margin-top.label',
  BOTTOM: 'barcode-widget.settings.margin-bottom.label',
  MM: 'barcode-widget.settings.mm.label'
};

class Settings extends Component {
  static propTypes = {
    settings: PropTypes.object,
    displayCondition: PropTypes.object,
    allowedTypes: PropTypes.array,
    onSave: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    settings: {},
    allowedTypes: [],
    onSave: () => null,
    onCancel: () => null
  };

  constructor(props) {
    super(props);

    this.state = {
      type: props.allowedTypes.find(type => type.value === props.settings.type) || {},
      scale: get(props, 'settings.scale', 100),
      top: get(props, 'settings.top', 0),
      right: get(props, 'settings.right', 0),
      bottom: get(props, 'settings.bottom', 0),
      left: get(props, 'settings.left', 0),
      dcGenerateNew: get(props, 'displayCondition.btnGenerateNew', '')
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { allowedTypes, settings, displayCondition } = this.props;

    if (!isEqualWith(allowedTypes, prevProps.allowedTypes, isEqual)) {
      this.setType();
    }

    if (!objectCompare(settings, prevProps.settings)) {
      this.setSettings();
    }

    if (!isEqual(displayCondition, prevProps.displayCondition)) {
      this.setState({ dcGenerateNew: get(displayCondition, 'btnGenerateNew', '') });
    }
  }

  setType(props = this.props) {
    this.setState({
      type: props.allowedTypes.find(type => type.value === props.settings.type) || {}
    });
  }

  setSettings(props = this.props) {
    this.setState({
      scale: get(props, 'settings.scale', 100),
      top: get(props, 'settings.top', 0),
      right: get(props, 'settings.right', 0),
      bottom: get(props, 'settings.bottom', 0),
      left: get(props, 'settings.left', 0)
    });
  }

  getNumber(value = '') {
    if (typeof value !== 'string') {
      return 0;
    }

    return parseInt(value.replace(/\D/g, ''), 10);
  }

  handleChangeScale = event => {
    const scale = get(event, 'target.value', '');

    this.setState({ scale: this.getNumber(scale) || 0 });
  };

  handleChangePosition = (event, position) => {
    const value = get(event, 'target.value', '');

    this.setState({ [position]: this.getNumber(value) || 0 });
  };

  onChangeCondition = event => {
    this.setState({ dcGenerateNew: event.target.value });
  };

  handleCancel = () => {
    const { onCancel } = this.props;

    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  handleSave = () => {
    const { onSave } = this.props;

    if (typeof onSave === 'function') {
      const { type, scale, top, left, right, bottom, dcGenerateNew } = this.state;
      const isValid = DisplayElementService.isValidCondition(dcGenerateNew);

      this.setState({ errorCondition: !isValid });
      isValid &&
        onSave(
          {
            scale,
            top,
            left,
            right,
            bottom,
            type: get(type, 'value', '')
          },
          {
            btnGenerateNew: dcGenerateNew
          }
        );
    }
  };

  render() {
    const { allowedTypes } = this.props;
    const { type, scale, top, left, right, bottom, dcGenerateNew, errorCondition } = this.state;

    return (
      <div className="ecos-barcode-settings">
        <div className="ecos-barcode-settings__group">
          <Label htmlFor="codeType" className="ecos-barcode-settings__label">
            {t(Labels.CODE_TYPE)}
          </Label>
          <Select options={allowedTypes} value={type} />
        </div>
        <div className="ecos-barcode-settings__group">
          <Label htmlFor="displayCondition1" className="ecos-barcode-settings__label">
            {t(Labels.DISPLAY_CONDITION_TITLE, { title: t('barcode-widget.btn.generate-new') })}
          </Label>
          <Textarea value={dcGenerateNew} onChange={this.onChangeCondition} placeholder={DisplayElementService.placeholderCondition} />
          {errorCondition && (
            <InfoText className="ecos-doc-constructor-settings__info" text={t(Labels.DISPLAY_CONDITION_ERR)} type="error" />
          )}
        </div>
        <div className="ecos-barcode-settings__section-name">{t(Labels.PRINT_SET)}</div>
        <div className="ecos-barcode-settings__group ecos-barcode-settings__group_parts">
          <div className="ecos-barcode-settings__group-part ecos-barcode-settings__group-part_greedy">
            <Label htmlFor="scale" className="ecos-barcode-settings__label">
              {t(Labels.SCALE)}
            </Label>
            <Input id="scale" align="right" value={scale} onChange={this.handleChangeScale} />
          </div>
          <div className="ecos-barcode-settings__group-part">
            <span className="ecos-barcode-settings__percent">%</span>
          </div>
        </div>

        <div className="ecos-barcode-settings__section-name ecos-barcode-settings__section-name_s">{t(Labels.MARGINS)}</div>
        <div className="ecos-barcode-settings__group">
          <Row>
            <Col>
              <div className="ecos-barcode-settings__group ecos-barcode-settings__group_parts">
                <div className="ecos-barcode-settings__group-part ecos-barcode-settings__group-part_greedy">
                  <Label htmlFor="left" className="ecos-barcode-settings__label">
                    {t(Labels.LEFT)}
                  </Label>
                  <Input id="left" align="right" value={left} onChange={e => this.handleChangePosition(e, 'left')} />
                </div>
                <div className="ecos-barcode-settings__group-part">
                  <span className="ecos-barcode-settings__percent">{t(Labels.MM)}</span>
                </div>
              </div>
            </Col>

            <Col>
              <div className="ecos-barcode-settings__group ecos-barcode-settings__group_parts">
                <div className="ecos-barcode-settings__group-part ecos-barcode-settings__group-part_greedy">
                  <Label htmlFor="right" className="ecos-barcode-settings__label">
                    {t(Labels.RIGHT)}
                  </Label>
                  <Input id="right" align="right" value={right} onChange={e => this.handleChangePosition(e, 'right')} />
                </div>
                <div className="ecos-barcode-settings__group-part">
                  <span className="ecos-barcode-settings__percent">{t(Labels.MM)}</span>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <div className="ecos-barcode-settings__group ecos-barcode-settings__group_parts">
                <div className="ecos-barcode-settings__group-part ecos-barcode-settings__group-part_greedy">
                  <Label htmlFor="top" className="ecos-barcode-settings__label">
                    {t(Labels.TOP)}
                  </Label>
                  <Input id="top" align="right" value={top} onChange={e => this.handleChangePosition(e, 'top')} />
                </div>
                <div className="ecos-barcode-settings__group-part">
                  <span className="ecos-barcode-settings__percent">{t(Labels.MM)}</span>
                </div>
              </div>
            </Col>

            <Col>
              <div className="ecos-barcode-settings__group ecos-barcode-settings__group_parts">
                <div className="ecos-barcode-settings__group-part ecos-barcode-settings__group-part_greedy">
                  <Label htmlFor="bottom" className="ecos-barcode-settings__label">
                    {t(Labels.BOTTOM)}
                  </Label>
                  <Input id="bottom" align="right" value={bottom} onChange={e => this.handleChangePosition(e, 'bottom')} />
                </div>
                <div className="ecos-barcode-settings__group-part">
                  <span className="ecos-barcode-settings__percent">{t(Labels.MM)}</span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="ecos-barcode-settings__footer">
          <Btn onClick={this.handleCancel} className="">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleSave} className="ecos-btn_blue">
            {t(Labels.DONE_BUTTON)}
          </Btn>
        </div>
      </div>
    );
  }
}

export default Settings;
