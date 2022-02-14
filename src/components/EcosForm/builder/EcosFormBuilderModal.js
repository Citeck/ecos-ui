import React from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import { flattenComponents } from 'formiojs/utils/formUtils';
import { Card, CardHeader, CardBody, Alert, Container, Row, Col } from 'reactstrap';

import EcosFormBuilder from './EcosFormBuilder';
import EcosModal from '../../common/EcosModal';
import DialogManager from '../../common/dialogs/Manager';
import { t } from '../../../helpers/export/util';
import { Icon, Tree } from '../../common';

import './style.scss';

const Labels = {
  CLOSE_CONFIRM_DESCRIPTION: 'ecos-form.builder.confirm-close.description',
  DEBUG_TITLE: 'ecos-form.builder.debugging.title'
};

// class Tree extends React.Component {
//   render() {
//     const { data } = this.props;
//
//     if (isEmpty(data)) {
//       return null;
//     }
//
//     return (
//       <ul>
//         {data && data.map(item => (
//           <>
//             <li style={{ color: item.isLooped ? 'red' : 'inherit'}}>{item.key}</li>
//
//             {item.values && (
//               <li>
//                 <Tree data={item.values}/>
//               </li>
//             )}
//           </>
//         ))}
//
//         {/*{data.values.map(item => (*/}
//         {/*  <>*/}
//         {/*    <li style={{ color: item.isLooped ? 'red' : 'inherit'}}>{item.key}</li>*/}
//         {/*    {!isEmpty(item.values) && <Tree data={item.values}/>}*/}
//         {/*  </>*/}
//         {/*))}*/}
//       </ul>
//     );
//   }
// }

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
    const treeOfDependencies = {};
    const treeOfInfluence = {};
    let hasLoopDependencies = 0;

    if (isDebugModalOpen) {
      const components = flattenComponents(get(formDefinition, 'components', []), false);
      const dependencies = {};
      const depByKey = {};

      function getDepByKey(comps) {
        for (let i = 0; i < comps.length; i++) {
          const key = comps[i];
          const component = components[key];
          let refreshOn = component.refreshOn;

          if (!depByKey[key]) {
            depByKey[key] = new Set();
          }

          if (isEmpty(refreshOn)) {
            continue;
          }

          if (isString(refreshOn)) {
            refreshOn = [refreshOn];
          } else if (isPlainObject(refreshOn)) {
            refreshOn = [get(refreshOn, 'value')];
          } else if (Array.isArray(refreshOn)) {
            refreshOn = refreshOn.map(item => (isString(item) ? item : get(item, 'value')));
          }

          refreshOn.forEach(field => {
            if (!depByKey[field]) {
              depByKey[field] = new Set();
            }

            depByKey[field].add(key);
          });
        }
      }

      getDepByKey(Object.keys(components));

      // Дерево зависимостей
      function getTreeOfDependencies(keys, parentKey, chain) {
        if (isEmpty(keys)) {
          return [];
        }

        if (isString(keys)) {
          keys = [keys];
        }

        const values = [];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const component = components[key];

          console.warn({ component, key, components });

          if (!component) {
            continue;
          }
          const data = { id: key, key, label: `${component.label} (${key})` };

          if (chain.has(key) || key === parentKey) {
            hasLoopDependencies += 1;
            values.push({ ...data, items: [], isLooped: true, icon: { type: 'icon', value: 'icon-alert text-danger' } });
            break;
          }

          chain.add(key);
          data.items = getTreeOfDependencies(component.refreshOn, parentKey, chain);
          values.push({ ...data });
        }

        return values;
      }

      // Дерево влияния
      function getTreeOfInfluence(keys, parentKey, chain) {
        if (isEmpty(keys)) {
          return [];
        }

        if (isString(keys)) {
          keys = [keys];
        }

        const values = [];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          if (!components[key]) {
            continue;
          }

          const data = { id: key, key, label: `${components[key].label} (${key})` };

          if (chain.has(key) || key === parentKey) {
            values.push({ ...data, items: [], isLooped: true, icon: { type: 'icon', value: 'icon-alert text-danger' } });
            break;
          }

          chain.add(key);
          data.items = getTreeOfInfluence([...(depByKey[key] || [])], parentKey, chain);
          values.push({ ...data });
        }

        return values;
      }

      for (let i = 0; i < Object.keys(components).length; i++) {
        const key = Object.keys(components)[i];
        const component = components[key];

        if (isEmpty(component.refreshOn)) {
          continue;
        }

        const dependencyChain = new Set();

        if (!treeOfDependencies[key]) {
          treeOfDependencies[key] = {
            id: key,
            key,
            label: `${component.label} (${key})`,
            items: []
          };
        }

        treeOfDependencies[key].items = getTreeOfDependencies(component.refreshOn, key, dependencyChain);
      }

      for (let i = 0; i < Object.keys(depByKey).length; i++) {
        const key = Object.keys(depByKey)[i];
        const influenceChain = new Set();

        if (!treeOfInfluence[key]) {
          influenceChain.add(key);
          treeOfInfluence[key] = {
            id: key,
            key,
            label: `${components[key].label} (${key})`,
            items: []
          };
        }

        treeOfInfluence[key].items = getTreeOfInfluence([...(depByKey[key] || [])], key, influenceChain);
      }

      console.warn({
        formDefinition,
        components,
        depByKey,
        treeOfDependencies,
        treeOfInfluence
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
          <CardBody>
            {hasLoopDependencies && <Alert color="danger">Обнаружена цикическая зависимость в {hasLoopDependencies} компонентах</Alert>}

            <Container>
              <Row>
                <Col md="6" sm="12">
                  <p>Дерево зависимостей</p>
                  <Alert color="primary">
                    Глубина дерева демонстрирует последовательность зависимости: родительский компонент зависит от дочернего и т.д.
                  </Alert>
                  <div className="form-builder-modal__tree-wrapper">
                    <Tree data={Object.values(treeOfDependencies)} openAll />
                  </div>
                </Col>
                <Col md="6" sm="12">
                  <p>Дерево влияния</p>
                  <Alert color="primary">
                    Дерево влияния представляет собой обратную зависимость: глубже в дереве зависимые компоненты
                  </Alert>
                  <div className="form-builder-modal__tree-wrapper">
                    <Tree data={Object.values(treeOfInfluence)} openAll />
                  </div>
                </Col>
              </Row>
            </Container>
          </CardBody>
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
