import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import { flattenComponents } from 'formiojs/utils/formUtils';
import { Card, CardHeader } from 'reactstrap';

import EcosFormBuilder from './EcosFormBuilder';
import EcosModal from '../../common/EcosModal';
import DialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/export/util';
import { Icon } from '../../common';
import { Caption } from '../../common/form';

const Labels = {
  CLOSE_CONFIRM_DESCRIPTION: 'ecos-form.builder.confirm-close.description',
  DEBUG_TITLE: 'ecos-form.builder.debugging.title'
};

export default class EcosFormBuilderModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formDefinition: {},
      isModalOpen: false,
      isDebugModalOpen: false
    };
  }

  show(formDefinition, onSubmit) {
    this.setState({
      isModalOpen: true,
      formDefinition: cloneDeep(formDefinition),
      onSubmit
    });
  }

  hide() {
    this.setState({
      isModalOpen: false
    });
  }

  toggleVisibility = () => {
    DialogManager.confirmDialog({
      text: t(Labels.CLOSE_CONFIRM_DESCRIPTION),
      onYes: () => {
        this.setState(state => ({
          isModalOpen: !state.isModalOpen
        }));
      }
    });
  };

  onSubmit(form) {
    if (this.state.onSubmit) {
      this.state.onSubmit(form);
    }
    this.hide();
  }

  onToggleShowDebugModal = () => {
    this.setState(state => ({ isDebugModalOpen: !state.isDebugModalOpen }));
  };

  renderCustomButtons() {
    return [
      <Icon
        key="ecos-form-builder-modal-debug-btn"
        className="icon-bug mr-2 icon_md ecos-form-modal__btn-settings"
        title={t(Labels.DEBUG_TITLE)}
        onClick={this.onToggleShowDebugModal}
      />
    ];
  }

  renderDebugModal() {
    const { isDebugModalOpen, formDefinition } = this.state;
    let content = [];

    if (isDebugModalOpen) {
      const components = flattenComponents(get(formDefinition, 'components', []), false);
      const dependencies = {};
      const getDependencies = key => {
        const component = components[key];

        if (isEmpty(component.refreshOn)) {
          return;
        }

        return {
          key,
          dependencies: component.refreshOn.forEach(getDependencies)
        };
      };

      function check(items = [], parentKey) {
        console.warn('items => ', items);

        for (let i = 0; i < items.length; i++) {
          const key = items[i];
          const component = components[key];

          if (!parentKey && isEmpty(component.refreshOn)) {
            continue;
          }

          if (!dependencies[key]) {
            dependencies[key] = new Set();
          }

          if (dependencies[parentKey || key].has(key)) {
            dependencies[parentKey || key].add({ item: key, type: Infinity });
            break;
          }

          if ([...dependencies[parentKey || key].values()].some(value => isObject(value))) {
            break;
          }

          dependencies[parentKey || key].add(key);

          if (!isEmpty(component.refreshOn)) {
            check(component.refreshOn, parentKey || key);
          }
        }
      }

      check(Object.keys(components));

      const depByKey = {};
      function getDepByKey(comps) {
        for (let i = 0; i < comps.length; i++) {
          const key = comps[i];
          const component = components[key];

          if (!depByKey[key]) {
            depByKey[key] = new Set();
          }

          if (isEmpty(component.refreshOn)) {
            continue;
          }

          component.refreshOn.forEach(field => {
            if (!depByKey[field]) {
              depByKey[field] = new Set();
            }

            depByKey[field].add(key);
          });
        }
      }

      getDepByKey(Object.keys(components));

      console.warn({
        formDefinition,
        components,
        dependencies,
        depByKey
      });
    }

    return (
      <EcosModal
        reactstrapProps={{ backdrop: 'static' }}
        className="ecos-modal_width-extra-lg"
        title={t(Labels.DEBUG_TITLE)}
        isOpen={isDebugModalOpen}
        zIndex={9001}
        hideModal={this.onToggleShowDebugModal}
      >
        <Card>
          <CardHeader>{t('Зависимости компонентов')}</CardHeader>
        </Card>
      </EcosModal>
    );
  }

  render() {
    let onSubmit = this.onSubmit.bind(this);
    let toggleVisibility = this.toggleVisibility.bind(this);

    return (
      <>
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-extra-lg"
          title="Form Builder"
          isOpen={this.state.isModalOpen}
          zIndex={9000}
          hideModal={toggleVisibility}
          customButtons={this.renderCustomButtons()}
        >
          <EcosFormBuilder formDefinition={this.state.formDefinition} onSubmit={onSubmit} onCancel={toggleVisibility} />
        </EcosModal>

        {this.renderDebugModal()}
      </>
    );
  }
}
