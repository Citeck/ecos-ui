import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { isMobileDevice, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { init, getBase64Barcode } from '../../../actions/barcode';
import Dashlet from '../../Dashlet';
import DAction from '../../../services/DashletActionService';
import Barcode from './Barcode';
import Settings from './Settings';
import BaseWidget from '../BaseWidget';
import { getBarcodePrintUrl } from '../../../helpers/urls';
import BarcodeConverter from '../../../dto/barcode';
import { defaultSettings } from '../../../constants/barcode';

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
      isOpenSettings: false
    };

    props.init(this.stateId);
  }

  componentDidMount() {
    super.componentDidMount();
    this.handleGenerateBarcode();
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
      onSave(id, { config: { ...config, settings } });
    }

    this.handleToggleSettings();
  };

  handleUpdate() {
    super.handleUpdate();
    this.handleGenerateBarcode();
  }

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
    const { isCollapsed } = this.state;
    const actions = {
      [DAction.Actions.SETTINGS]: {
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
        isCollapsed={isCollapsed}
        onToggleCollapse={this.handleToggleContent}
        actionDrag={isMobileDevice()}
        setRef={this.setDashletRef}
      >
        <Scrollbars {...this.scrollbarProps}>
          {this.renderBarcode()}
          {this.renderSettings()}
        </Scrollbars>
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
