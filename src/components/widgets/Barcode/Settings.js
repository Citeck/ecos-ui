import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Row, Col } from 'reactstrap';

import { Label, Input, Select } from '../../common/form';
import { Btn } from '../../common/btns';
import { t, arrayCompare, objectCompare } from '../../../helpers/util';

const Labels = {
  SCALE: 'barcode-widget.settings.scale.label',
  CODE_TYPE: 'barcode-widget.settings.code-type.label',
  MARGINS: 'barcode-widget.settings.margins.label',
  LEFT: 'barcode-widget.settings.margin-left.label',
  RIGHT: 'barcode-widget.settings.margin-right.label',
  TOP: 'barcode-widget.settings.margin-top.label',
  BOTTOM: 'barcode-widget.settings.margin-bottom.label',
  MM: 'barcode-widget.settings.mm.label',
  DONE_BUTTON: 'btn.done.label',
  CANCEL_BUTTON: 'btn.cancel.label'
};

class Settings extends Component {
  static propTypes = {
    settings: PropTypes.object,
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
      left: get(props, 'settings.left', 0)
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { allowedTypes, settings } = this.props;

    if (!arrayCompare(allowedTypes, prevProps.allowedTypes)) {
      this.setType();
    }

    if (!objectCompare(settings, prevProps.settings)) {
      this.setSettings();
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

  handleCancel = () => {
    const { onCancel } = this.props;

    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  handleSave = () => {
    const { onSave } = this.props;

    if (typeof onSave === 'function') {
      const { type, scale, top, left, right, bottom } = this.state;

      onSave({
        scale,
        top,
        left,
        right,
        bottom,
        type: get(type, 'value', '')
      });
    }
  };

  render() {
    const { allowedTypes } = this.props;
    const { type, scale, top, left, right, bottom } = this.state;

    return (
      <div className="ecos-barcode-settings">
        <div className="ecos-barcode-settings__group">
          <Label htmlFor="my-input2" className="ecos-barcode-settings__label">
            {t(Labels.CODE_TYPE)}
          </Label>
          <Select options={allowedTypes} value={type} />
        </div>

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

        <div className="ecos-barcode-settings__section-name">{t(Labels.MARGINS)}</div>

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
