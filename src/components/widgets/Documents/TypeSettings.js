import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';

import { SortableContainer, SortableElement, SortableHandle } from '../../Drag-n-Drop';
import { EcosModal, Tabs, Icon } from '../../common';
import { Btn } from '../../common/btns';
import { Checkbox } from '../../common/form';
import { t, objectCompare, deepClone, arrayMove } from '../../../helpers/util';
import { DynamicTypeInterface, TypeSettingsInterface } from './propsInterfaces';

const Labels = {
  TITLE: 'documents-widget.type-settings.title',
  CANCEL_BUTTON: 'documents-widget.settings-modal.button.cancel',
  OK_BUTTON: 'documents-widget.settings-modal.button.ok',
  UPLOAD_LABEL: 'documents-widget.type-settings.upload-label',
  SORT_LABEL: 'documents-widget.type-settings.sort-label',
  ONE_FILE: 'documents-widget.type-settings.one-file',
  MULTIPLE_FILES: 'documents-widget.type-settings.multiple-files'
};
const FileCount = {
  ONE: 'one',
  MULTIPLE: 'multiple'
};

class TypeSettings extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    settings: PropTypes.shape(TypeSettingsInterface),
    type: PropTypes.oneOfType([() => null, PropTypes.shape(DynamicTypeInterface)]),
    onCancel: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    isLoading: false,
    onCancel: () => {},
    onSave: () => {}
  };

  state = {
    settings: {},
    countTabs: [
      {
        key: FileCount.ONE,
        value: t(Labels.ONE_FILE)
      },
      {
        key: FileCount.MULTIPLE,
        value: t(Labels.MULTIPLE_FILES)
      }
    ],
    draggableNode: null
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!objectCompare(prevProps.settings, this.props.settings) || isEmpty(this.state.settings)) {
      this.setState({ settings: this.props.settings });
    }
  }

  get title() {
    const { type } = this.props;

    if (type === null || !type.name) {
      return t(Labels.TITLE);
    }

    return `${type.name} - ${t(Labels.TITLE)}`;
  }

  handleCloseModal = () => {
    this.setState({ settings: {} });
    this.props.onCancel();
  };

  handleClickSave = () => {
    this.props.onSave(this.state.settings);
    this.setState({ settings: {} });
  };

  handleChangeCountFiles = index => {
    this.setState(state => ({
      ...state,
      settings: {
        ...state.settings,
        multiple: state.countTabs[index].key === FileCount.MULTIPLE
      }
    }));
  };

  handleToggleColumnVisibility = (position, checked) => {
    const { settings } = this.state;
    const columns = deepClone(settings.columns);

    columns[position].visible = checked;

    this.setState(state => ({
      ...state,
      settings: {
        ...state.settings,
        columns
      }
    }));
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('ecos-docs__columns-item_sorting');

    this.setState({ draggableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode, settings } = this.state;

    event.stopPropagation();
    draggableNode.classList.toggle('ecos-docs__columns-item_sorting');

    const columns = arrayMove(settings.columns, oldIndex, newIndex);

    this.setState({ draggableNode: null, settings: { ...settings, columns } });
  };

  renderCountFiles() {
    const { settings, countTabs } = this.state;

    if (settings === null) {
      return null;
    }

    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.UPLOAD_LABEL)}</div>
        <Tabs
          className="ecos-docs__modal-type-settings-tabs"
          classNameTab="ecos-docs__modal-type-settings-tabs-item"
          items={countTabs}
          keyField="key"
          valueField="value"
          activeTabKey={settings.multiple ? FileCount.MULTIPLE : FileCount.ONE}
          onClick={this.handleChangeCountFiles}
        />
      </section>
    );
  }

  renderColumns() {
    const {
      settings: { columns = [] }
    } = this.state;

    return (
      <section className="ecos-docs__modal-type-settings-group">
        <div className="ecos-docs__modal-type-settings-label">{t(Labels.SORT_LABEL)}</div>

        <SortableContainer
          axis="y"
          lockAxis="y"
          lockOffset="50%"
          transitionDuration={300}
          useDragHandle
          updateBeforeSortStart={this.handleBeforeSortStart}
          onSortEnd={this.handleSortEnd}
        >
          <div className="ecos-docs__columns">
            <Scrollbars autoHeight autoHeightMin={0} autoHeightMax={'284px'}>
              {columns.map((column, position) => (
                <SortableElement key={column.label} index={position}>
                  <div className="ecos-docs__columns-item">
                    <SortableHandle>
                      <Icon className={classNames('icon-drag', 'ecos-docs__columns-item-dnd')} />
                    </SortableHandle>

                    <Checkbox
                      className="ecos-docs__columns-item-checkbox"
                      checked={column.visible}
                      onClick={checked => this.handleToggleColumnVisibility(position, checked)}
                    />
                    <div className="ecos-docs__columns-item-label">{column.label}</div>
                  </div>
                </SortableElement>
              ))}
            </Scrollbars>
          </div>
        </SortableContainer>
      </section>
    );
  }

  render() {
    const { isOpen, isLoading } = this.props;

    return (
      <EcosModal
        title={this.title}
        isOpen={isOpen}
        isLoading={isLoading}
        className="ecos-docs__modal-type-settings"
        hideModal={this.handleCloseModal}
      >
        {this.renderCountFiles()}
        {this.renderColumns()}
        <div className="ecos-docs__modal-type-settings-footer">
          <Btn onClick={this.handleCloseModal} className="ecos-docs__modal-settings-footer-item">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleClickSave} className="ecos-btn_blue ecos-docs__modal-settings-footer-item">
            {t(Labels.OK_BUTTON)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default TypeSettings;
