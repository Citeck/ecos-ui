import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { selectImportDataConfig, selectJournalConfig } from '../../selectors/journals';
import { Dropdown } from '../common/form';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import LicenseService from '../../services/license/LicenseService';
import { getTextByLocale, isMobileDevice } from '../../helpers/util';
import { t } from '../../helpers/export/util';
import { Tooltip } from '../common';
import Download from '../common/icons/Download';
import PageService from '../../services/PageService';
import './Import.scss';

class Import extends Component {
  static propTypes = {
    className: PropTypes.string,
    classNameBtn: PropTypes.string,
    importDataConfig: PropTypes.arrayOf(PropTypes.object),
    isViewNewJournal: PropTypes.bool,
    right: PropTypes.bool,
    getStateOpen: PropTypes.func
  };

  state = {
    importDataConfig: [],
    isOpenDropdown: false,
    hasImportDataLicense: false
  };

  componentDidMount() {
    LicenseService.hasImportDataFeature().then(hasFeature => {
      if (hasFeature) {
        this.setState({
          hasImportDataLicense: true
        });
      }
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { importDataConfig } = this.props;

    if (!isEqual(importDataConfig, prevProps.importDataConfig)) {
      this.setState({ importDataConfig });
    }
  }

  changeIsOpen = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      this.setState({ isOpenDropdown });
      isFunction(this.props.getStateOpen) && this.props.getStateOpen(isOpenDropdown);
    }
  };

  dropdownSourceVariants(importDataConfig, hasImportDataLicense) {
    return hasImportDataLicense ? importDataConfig : [];
  }

  handleImport = item => {
    console.log('item:', item);
  };

  handleDownloadTemplates = variantId => {
    const { journalConfig = {} } = this.props;

    const proxyUrl = process.env.REACT_APP_SHARE_PROXY_URL;
    const journalType = get(journalConfig, 'typeRef');

    if (proxyUrl && journalType) {
      PageService.changeUrlLink(
        `${proxyUrl}/gateway/integrations/api/import-data/download-template?typeRef=${journalType}&variantId=${variantId}`,
        {
          openNewBrowserTab: true
        }
      );
    }
  };

  handleOnClick = (event, callback) => {
    event.stopPropagation();
    isFunction(callback) && callback(event);
  };

  renderItemMenu = ({ item }) => {
    const textItem = getTextByLocale(get(item, 'name', ''));
    const variantId = get(item, 'variantId');

    if (!variantId) {
      return null;
    }

    return (
      <li className="citeck-import-data__menu-item" onClick={() => this.handleImport(item)}>
        <Tooltip target={`import-data-text_${variantId}`} uncontrolled showAsNeeded text={textItem} off={isMobileDevice()}>
          <span id={`import-data-text_${variantId}`}>{textItem}</span>
        </Tooltip>
        <Tooltip
          target={`import-data-download_${variantId}`}
          uncontrolled
          showAsNeeded
          text={t('citeck-dropdown.import.download')}
          off={isMobileDevice()}
        >
          <i
            id={`import-data-download_${variantId}`}
            className="citeck-import-data__menu-item_i"
            onClick={e => this.handleOnClick(e, this.handleDownloadTemplates(variantId))}
          >
            <Download />
          </i>
        </Tooltip>
      </li>
    );
  };

  render() {
    const { isViewNewJournal, classNameBtn, children, className, right } = this.props;
    const { importDataConfig, isOpenDropdown, hasImportDataLicense } = this.state;

    const variants = this.dropdownSourceVariants(importDataConfig, hasImportDataLicense);

    if (!variants || !variants.length) {
      return null;
    }

    return (
      <div className={classNames('citeck-import-data', { [className]: !!className })}>
        <Dropdown
          isButton
          hasEmpty
          isStatic={!importDataConfig}
          right={right}
          source={variants}
          controlIcon="icon-download"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down', classNameBtn, {
            'ecos-journal__btn_new_focus': isOpenDropdown && isViewNewJournal
          })}
          getStateOpen={this.changeIsOpen}
          isViewNewJournal={isViewNewJournal}
          CustomItem={this.renderItemMenu}
        >
          {children}
        </Dropdown>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  importDataConfig: selectImportDataConfig(state, props.stateId),
  journalConfig: selectJournalConfig(state, props.stateId)
});

export default connect(mapStateToProps)(Import);
