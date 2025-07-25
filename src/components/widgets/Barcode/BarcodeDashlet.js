import classNames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import * as React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import { getBase64Barcode, init } from '../../../actions/barcode';
import { defaultSettings } from '../../../constants/barcode';
import BarcodeConverter from '../../../dto/barcode';
import { getStateId } from '../../../helpers/redux';
import { getBarcodePrintUrl } from '../../../helpers/urls';
import { isMobileDevice, t } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import PageTabList from '../../../services/pageTabs/PageTabList';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';

import Barcode from './Barcode';
import Settings from './Settings';

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

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    if (!!prevProps.config && !isEqual(prevProps.config, this.props.config)) {
      this.props.init(this.stateId);
    }
  }

  get settings() {
    const { config } = this.props;

    return get(config, 'settings', defaultSettings);
  }

  get displayCondition() {
    const { config } = this.props;

    return get(config, 'elementsDisplayCondition');
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

  handleSaveSettings = (settings, elementsDisplayCondition) => {
    const { id, onSave, config } = this.props;

    if (typeof onSave === 'function') {
      onSave(id, { config: { ...config, settings, elementsDisplayCondition } });
    }

    this.handleToggleSettings();
  };

  handleUpdate() {
    super.handleUpdate();
    this.handleGenerateBarcode();
  }

  renderBarcode() {
    const { config, classNameBarcode, barcode, error, isLoading, displayElements } = this.props;
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
        displayElements={displayElements || {}}
      />
    );
  }

  renderSettings() {
    const { allowedTypes, modelAttributes } = this.props;
    const { isOpenSettings } = this.state;

    if (!isOpenSettings) {
      return null;
    }

    return (
      <Settings
        settings={this.settings}
        displayCondition={this.displayCondition}
        allowedTypes={allowedTypes}
        modelAttributes={modelAttributes}
        onSave={this.handleSaveSettings}
        onCancel={this.handleToggleSettings}
      />
    );
  }

  render() {
    const { title, classNameDashlet, ...props } = this.props;
    const actions = {
      [DAction.Actions.SETTINGS]: {
        onClick: this.handleToggleSettings
      }
    };

    return (
      <Dashlet
        {...props}
        title={title}
        actionConfig={actions}
        bodyClassName="ecos-barcode-dashlet__body"
        className={classNames('ecos-barcode-dashlet', classNameDashlet)}
        resizable={false}
        needGoTo={false}
        isCollapsed={this.isCollapsed}
        onToggleCollapse={this.handleToggleContent}
        actionDrag={isMobileDevice()}
        setRef={this.setDashletRef}
      >
        <Scrollbars
          autoHide
          renderTrackHorizontal={props => <div {...props} hidden />}
          renderThumbHorizontal={props => <div {...props} hidden />}
          {...this.scrollbarProps}
        >
          <div className="ecos-barcode-dashlet__body-content">
            {this.renderBarcode()}
            {this.renderSettings()}
          </div>
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
    settings: BarcodeConverter.getSettingsForWeb(get(stateB, 'config.settings')),
    displayElements: stateB.displayElements,
    modelAttributes: get(state, ['dashboard', PageTabList.activeTab.id, 'modelAttributes'])
  };
};

const mapDispatchToProps = (dispatch, { record, config }) => {
  return {
    init: stateId => dispatch(init({ stateId, record, config })),
    generateBase64Barcode: stateId => dispatch(getBase64Barcode({ stateId, record }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BarcodeDashlet);
