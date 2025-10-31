import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';

import GoToButton from '../../Journals/JournalsDashletEditor/GoToButton';

class Settings extends Component {
  static propTypes = {
    widget: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { goToButtonName: this.goToButtonName };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { goToButtonName } = this.state;

    if (!isEqual(goToButtonName, this.goToButtonName) && isEqual(goToButtonName, prevState.goToButtonName)) {
      this.setState({ goToButtonName: this.goToButtonName });
    }
  }

  get goToButtonName() {
    return get(this.props, 'widget.goToButtonName');
  }

  get isSmall() {
    return get(this.props, 'widget.isSmall');
  }

  sendData = () => {
    const { onChange } = this.props;
    const { goToButtonName } = this.state;

    if (isFunction(onChange)) {
      onChange({ goToButtonName });
    }
  };

  handleChangeGoToButtonName = goToButtonName => {
    this.setState({ goToButtonName }, this.sendData);
  };

  render() {
    const { goToButtonName } = this.state;

    return (
      <>
        <GoToButton isSmall={this.isSmall} value={goToButtonName} onChange={this.handleChangeGoToButtonName} />
      </>
    );
  }
}

export default Settings;
