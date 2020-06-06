import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { isMobileDevice, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { init, getBase64Barcode } from '../../../actions/barcode';
import Dashlet, { BaseActions } from '../../Dashlet';
import Barcode from './Barcode';
import Settings from './Settings';
import BaseWidget from '../BaseWidget';

import './style.scss';
import { getBarcodePrintUrl } from '../../../helpers/urls';
import BarcodeConverter from '../../../dto/barcode';
import { defaultSettings } from '../../../constants/barcode';

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
      isOpenSettings: false
    };

    props.init(this.stateId);
  }

  componentDidMount() {
    this.handleGenerateBarcode();
    this.watcher = this.instanceRecord.watch('cm:modified', this.reload);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.runGenerateBarcode();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  get settings() {
    const { config } = this.props;

    return get(config, 'settings', defaultSettings);
  }

  handleGenerateBarcode = () => {
    this.props.generateBase64Barcode(this.stateId);
  };

  handleToggleSettings = () => {
    this.setState(state => ({ isOpenSettings: !state.isOpenSettings }));
  };

  handlePrint = () => {
    const { record, config } = this.props;
    const settings = get(config, 'settings', defaultSettings);
    const url = getBarcodePrintUrl(record, BarcodeConverter.getSettingsForUrl(settings));

    window.open(url, '_blank');
  };

  handleSaveSettings = settings => {
    const { id, onSave, config } = this.props;

    if (typeof onSave === 'function') {
      onSave(id, { config: { ...config, settings } }, console.warn);
    }

    this.handleToggleSettings();
  };

  renderBarcode() {
    const { config, classNameBarcode, barcode, error, isLoading } = this.props;
    const { isOpenSettings } = this.state;

    return (
      <Barcode
        {...config}
        className={classNames(classNameBarcode, {
          'ecos-barcode_hidden': isOpenSettings
        })}
        barcode={barcode}
        error={error}
        isLoading={isLoading}
        onGenerate={this.handleGenerateBarcode}
        onPrint={this.handlePrint}
      />
    );
  }

  renderSettings() {
    const { allowedTypes } = this.props;
    const { isOpenSettings } = this.state;

    if (!isOpenSettings) {
      return null;
    }

    return (
      <Settings
        settings={this.settings}
        allowedTypes={allowedTypes}
        onSave={this.handleSaveSettings}
        onCancel={this.handleToggleSettings}
      />
    );
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

const mapStateToProps = (state, ownProps) => {
  const stateId = getStateId(ownProps);
  const stateB = state.barcode[stateId] || {};

  return {
    barcode: stateB.barcode,
    error: stateB.error,
    isLoading: stateB.isLoading,
    allowedTypes: stateB.allowedTypes,
    settings: BarcodeConverter.getSettingsForWeb(get(stateB, 'config.settings'))
  };
};

const mapDispatchToProps = (dispatch, { record }) => ({
  init: stateId => dispatch(init(stateId)),
  generateBase64Barcode: stateId => dispatch(getBase64Barcode({ stateId, record }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BarcodeDashlet);
