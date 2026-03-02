import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/util';
import { Checkbox } from '../../common/form';

class Settings extends Component {
  static propTypes = {
    widget: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      allowChangeStatus: get(props, 'widget.allowChangeStatus', false)
    };
  }

  sendData = () => {
    const { onChange } = this.props;
    const { allowChangeStatus } = this.state;

    if (isFunction(onChange)) {
      onChange({ allowChangeStatus });
    }
  };

  handleToggle = ({ checked }) => {
    this.setState({ allowChangeStatus: checked }, this.sendData);
  };

  render() {
    const { allowChangeStatus } = this.state;

    return (
      <Checkbox className="w-100" checked={allowChangeStatus} onChange={this.handleToggle}>
        {t('doc-status-widget.settings.allow-change-status')}
      </Checkbox>
    );
  }
}

export default Settings;
