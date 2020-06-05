import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isMobileDevice, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import Dashlet, { BaseActions } from '../../Dashlet';
import Barcode from './Barcode';
import Settings from './Settings';
import BaseWidget from '../BaseWidget';

import './style.scss';

class BarcodeDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameBarcode: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({})
  };

  static defaultProps = {
    title: t('barcode-widget.dashlet.title'),
    classNameBarcode: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);

    this.state = {
      ...this.state,
      isOpenSettings: true
    };
  }

  componentDidMount() {
    this.watcher = this.instanceRecord.watch('cm:modified', this.reload);
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  handleToggleSettings = () => {
    this.setState(state => ({ isOpenSettings: !state.isOpenSettings }));
  };

  renderBarcode() {
    const { config, classNameBarcode, record } = this.props;
    const { runUpdate, isOpenSettings } = this.state;

    return (
      <Barcode
        {...config}
        className={classNames(classNameBarcode, {
          'ecos-barcode_hidden': isOpenSettings
        })}
        record={record}
        stateId={this.stateId}
        runUpdate={runUpdate}
      />
    );
  }

  renderSettings() {
    const { isOpenSettings } = this.state;

    if (!isOpenSettings) {
      return null;
    }

    return <Settings />;
  }

  render() {
    const { title, classNameDashlet } = this.props;
    const actions = {
      [BaseActions.SETTINGS]: {
        onClick: this.handleToggleSettings
      }
    };

    return (
      <Dashlet
        title={title}
        actionConfig={actions}
        bodyClassName="ecos-barcode-dashlet__body"
        className={classNames('ecos-barcode-dashlet', classNameDashlet)}
        resizable={false}
        needGoTo={false}
        actionDrag={isMobileDevice()}
      >
        {this.renderBarcode()}
        {this.renderSettings()}
      </Dashlet>
    );
  }
}

export default BarcodeDashlet;
