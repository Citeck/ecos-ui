import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../../helpers/export/util';
import { Well } from '../../common/form';
import EcosModal from '../../common/EcosModal';
import EcosModalHeight from '../../common/EcosModal/EcosModalHeight';
import JournalsFilters from '../JournalsFilters/JournalsFilters';
import JournalsColumnsSetup from '../JournalsColumnsSetup/JournalsColumnsSetup';
import JournalsGrouping from '../JournalsGrouping/JournalsGrouping';
import JournalsSettingsFooter from '../JournalsSettingsFooter/JournalsSettingsFooter';

class SettingsModal extends Component {
  static propTypes = {
    journalSetting: PropTypes.object,
    columnsSetup: PropTypes.object,
    grouping: PropTypes.object,
    originGridSettings: PropTypes.object,
    filtersData: PropTypes.object,
    columnsData: PropTypes.object,
    groupingData: PropTypes.object,
    isReset: PropTypes.bool,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onApply: PropTypes.func,
    onCreate: PropTypes.func,
    noCreateBtn: PropTypes.bool,
    onSave: PropTypes.func
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      predicate: cloneDeep(get(props, 'filtersData.predicate', [])),
      columns: cloneDeep(get(props, 'columnsData.columns', [])),
      sortBy: cloneDeep(get(props, 'columnsData.sortBy', [])),
      grouping: cloneDeep(get(props, 'groupingData', {})),
      needUpdate: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.setState({
        predicate: cloneDeep(get(this.props, 'filtersData.predicate', [])),
        columns: cloneDeep(get(this.props, 'columnsData.columns', [])),
        sortBy: cloneDeep(get(this.props, 'columnsData.sortBy', [])),
        grouping: cloneDeep(get(this.props, 'groupingData', {}))
      });
    }
  }

  getSetting = () => {
    const { predicate, columns, sortBy, grouping } = this.state;

    return {
      sortBy,
      groupBy: get(grouping, 'groupBy'),
      columns,
      predicate,
      grouping
    };
  };

  handleSetPredicate = predicate => {
    if (!isEqual(predicate, this.state.predicate)) {
      this.setState({ predicate });
    }
  };

  handleChangeColumns = ({ columns, sortBy }) => {
    this.setState({ columns, sortBy });
  };

  handleChangeGrouping = grouping => {
    this.setState({ grouping });
  };

  handleApply = () => {
    const { filtersData, onApply } = this.props;
    const { predicate } = this.state;

    if (isFunction(onApply)) {
      onApply(!isEqual(predicate, get(filtersData, 'predicate')), this.getSetting());
    }
  };

  handleCreate = () => {
    const { onCreate } = this.props;
    isFunction(onCreate) && onCreate(this.getSetting());
  };

  handleSave = () => {
    const { onSave } = this.props;

    if (isFunction(onSave)) {
      const setting = this.getSetting();

      onSave(setting.id, setting);
    }
  };

  handleReset = () => {
    const { originGridSettings } = this.props;

    this.setState(
      {
        predicate: cloneDeep(get(originGridSettings, 'predicate')),
        sortBy: cloneDeep(get(originGridSettings, 'columnsSetup.sortBy')),
        columns: cloneDeep(get(originGridSettings, 'columnsSetup.columns')),
        grouping: cloneDeep(get(originGridSettings, 'grouping')),
        needUpdate: true
      },
      () => this.setState({ needUpdate: false })
    );
  };

  handleResetFilters = () => {
    const { originGridSettings } = this.props;

    this.setState({
      predicate: cloneDeep(get(originGridSettings, 'predicate'))
    });
  };

  render() {
    const { filtersData, journalSetting, isOpen, isReset, onClose, noCreateBtn } = this.props;
    const { predicate, needUpdate, columns, sortBy, grouping } = this.state;

    return (
      <EcosModal
        title={t('journals.action.setting-dialog-msg')}
        isOpen={isOpen}
        hideModal={onClose}
        isBigHeader
        className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
      >
        <Well className="ecos-journal__settings">
          <EcosModalHeight>
            {height => (
              <Scrollbars style={{ height }}>
                <JournalsFilters
                  {...filtersData}
                  predicate={predicate}
                  needUpdate={isReset || needUpdate}
                  setPredicate={this.handleSetPredicate}
                  handleReset={this.handleResetFilters}
                />
                {this.props.columnsData && <JournalsColumnsSetup columns={columns} sortBy={sortBy} onChange={this.handleChangeColumns} />}
                {this.props.groupingData && (
                  <JournalsGrouping grouping={grouping} allowedColumns={columns} onChange={this.handleChangeGrouping} />
                )}
              </Scrollbars>
            )}
          </EcosModalHeight>

          <JournalsSettingsFooter
            parentClass="ecos-journal__settings"
            noCreateBtn={noCreateBtn}
            canSave={!noCreateBtn && !isEmpty(journalSetting.id)}
            onApply={this.handleApply}
            onCreate={this.handleCreate}
            onReset={this.handleReset}
            onSave={this.handleSave}
          />
        </Well>
      </EcosModal>
    );
  }
}

export default SettingsModal;
