import { defaultSettings } from '@citeck/constants/barcode';
import classNames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import * as React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import BaseWidget from '../BaseWidget';

import Barcode from './Barcode';
import Settings from './Settings';
import { reservePrintWindow, showPrintPdf } from './printWindow';

import { getBarcodePrintPdf, getBase64Barcode, init } from '@/actions/barcode';
import Dashlet from '@/components/dashboard/Dashlet';
import BarcodeConverter from '@/dto/barcode';
import { getPrintErrorKey, isLegacyBarcodeRecord, validatePrintSettings } from '@/dto/barcodePrint';
import { getStateId } from '@/helpers/store';
import { getBarcodePrintUrl } from '@/helpers/urls';
import { isMobileDevice, t } from '@/helpers/util';
import { selectActiveTab } from '@/selectors/pageTabs';
import DAction from '@/services/DashletActionService';
import PageTabList from '@/services/pageTabs/PageTabList';

import './style.scss';

export class BarcodeDashlet extends BaseWidget {
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
      isOpenSettings: false,
      isPrinting: false,
      printError: null
    };

    props.init(this.stateId);
  }

  componentDidMount() {
    super.componentDidMount();
    this.handleGenerateBarcode();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    if (prevProps.record !== this.props.record || (prevProps.isPrintPageActive !== false && this.props.isPrintPageActive === false)) {
      this.cancelPendingPrint();
      this.setState({ isPrinting: false, printError: null });
    }

    if (!!prevProps.config && !isEqual(prevProps.config, this.props.config)) {
      this.props.init(this.stateId);
    }
  }

  componentWillUnmount() {
    this.cancelPendingPrint();
    super.componentWillUnmount();
  }

  cancelPendingPrint = () => {
    const operation = this.printOperation;
    this.printOperation = null;
    if (operation) {
      operation.controller.abort();
      operation.tab?.close();
      operation.tab = null;
    }
  };

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

  handlePrint = async () => {
    const { record, config, loadPrintPdf } = this.props;
    if (isLegacyBarcodeRecord(record)) {
      const settings = get(config, 'settings', defaultSettings);
      window.open(getBarcodePrintUrl(record, BarcodeConverter.getSettingsForUrl(settings)), '_blank');
      return;
    }
    if (this.printOperation || this.props.isPrintPageActive === false) {
      return;
    }
    const printSettings = config?.printSettings;
    if (Object.keys(validatePrintSettings(printSettings)).length) {
      this.setState({ printError: 'barcode-widget.print.error.settings' });
      return;
    }

    const operation = { controller: new AbortController(), tab: null };
    this.printOperation = operation;
    this.setState({ isPrinting: true, printError: null });
    try {
      operation.tab = reservePrintWindow(t('barcode-widget.print.loading'));
      if (!operation.tab) {
        this.setState({ printError: 'barcode-widget.print.error.popup' });
        return;
      }
      const blob = await loadPrintPdf({ record, printSettings, signal: operation.controller.signal });
      if (this.printOperation !== operation) {
        return;
      }
      if (operation.tab.closed) {
        this.setState({ printError: 'barcode-widget.print.error.closed' });
        return;
      }
      showPrintPdf(operation.tab, blob);
      operation.tab = null;
    } catch (error) {
      if (this.printOperation === operation) {
        this.setState({ printError: getPrintErrorKey(error) });
      }
    } finally {
      operation.tab?.close();
      if (this.printOperation === operation) {
        this.printOperation = null;
        this.setState({ isPrinting: false });
      }
    }
  };

  handleSaveSettings = (settings, elementsDisplayCondition) => {
    const { id, onSave, config } = this.props;

    if (typeof onSave === 'function') {
      const settingsKey = isLegacyBarcodeRecord(this.props.record) ? 'settings' : 'printSettings';
      const conditions =
        settingsKey === 'printSettings' ? { ...config?.elementsDisplayCondition, ...elementsDisplayCondition } : elementsDisplayCondition;
      onSave(id, { config: { ...config, [settingsKey]: settings, elementsDisplayCondition: conditions } });
    }

    this.handleToggleSettings();
  };

  handleUpdate() {
    super.handleUpdate();
    this.handleGenerateBarcode();
  }

  renderBarcode() {
    const { config, classNameBarcode, barcode, error, isLoading, displayElements } = this.props;
    const { isOpenSettings, isPrinting, printError } = this.state;

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
        isPrinting={isPrinting}
        printError={printError ? t(printError) : null}
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
        isLegacy={isLegacyBarcodeRecord(this.props.record)}
        printSettings={this.props.config?.printSettings}
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
    // Cached Dashboard can block layout props; this connection still receives tab changes.
    isPrintPageActive: !ownProps.tabId || selectActiveTab(state)?.id === ownProps.tabId,
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
    generateBase64Barcode: stateId => dispatch(getBase64Barcode({ stateId, record })),
    loadPrintPdf: params => new Promise((onSuccess, onError) => dispatch(getBarcodePrintPdf({ ...params, onSuccess, onError })))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BarcodeDashlet);
