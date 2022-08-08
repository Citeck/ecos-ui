import React, { Component } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import find from 'lodash/find';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import {
  Card,
  CardBody,
  Alert,
  Container,
  Row,
  Col,
  Collapse,
  UncontrolledAlert,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';

import { Tree } from '../../common';
import EcosModal from '../../common/EcosModal';
import { t } from '../../../helpers/export/util';
import { ErrorBoundary } from '../../ErrorBoundary';

const Labels = {
  DEBUG_TITLE: 'ecos-form.builder.debugging.title',
  TABS_LABEL_DEPENDENCIES: 'ecos-form.builder.debugging.dependencies-tab.title',
  ALERT_LOOP: 'ecos-form.builder.debugging.alert.loop',
  ALERT_NOT_LOOP: 'ecos-form.builder.debugging.alert.not-loop',
  TREE_DEPENDENCIES_LABEL: 'ecos-form.builder.debugging.tree.dependencies.label',
  TREE_INFLUENCE_LABEL: 'ecos-form.builder.debugging.tree.influence.label',
  TREE_DEPENDENCIES_INFO: 'ecos-form.builder.debugging.tree.dependencies.info',
  TREE_INFLUENCE_INFO: 'ecos-form.builder.debugging.tree.influence.info',
  ERROR_BOUNDARY_MSG: 'ecos-form.builder.debugging.fatal-error'
};
const Tabs = {
  DEPENDENCIES: 'dependencies'
};

class DebugModal extends Component {
  state = {
    isOpenDependencies: true,
    isOpenInfluence: true,
    treeOfDependencies: [],
    treeOfInfluence: [],
    activeTab: Tabs.DEPENDENCIES
  };

  #numberOfLoops = 0;
  #dependenciesByKey = {};
  #tabs = {
    [Tabs.DEPENDENCIES]: {
      id: Tabs.DEPENDENCIES,
      label: t(Labels.TABS_LABEL_DEPENDENCIES),
      content: () => this.renderDependenciesTab()
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.numberOfLoops = 0;

      this.setState({ activeTab: Tabs.DEPENDENCIES });
      this.getTree();
    }
  }

  get tabs() {
    return Object.values(this.#tabs);
  }

  get tab() {
    const { activeTab } = this.state;

    return find(this.#tabs, { id: activeTab }) || {};
  }

  get components() {
    return get(this, 'props.components', []);
  }

  get numberOfLoops() {
    return this.#numberOfLoops;
  }

  set numberOfLoops(count) {
    this.#numberOfLoops = count;
  }

  get dependenciesByKey() {
    return this.#dependenciesByKey;
  }

  set dependenciesByKey(dependencies) {
    this.#dependenciesByKey = dependencies;
  }

  get loopedData() {
    return {
      icon: {
        type: 'icon',
        value: 'icon-alert text-danger'
      },
      className: 'alert-danger'
    };
  }

  getDependenciesByKey(keys) {
    const dependencies = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const component = this.components[key];
      let refreshOn = component.refreshOn;

      if (!dependencies[key]) {
        dependencies[key] = new Set();
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
        if (!dependencies[field]) {
          dependencies[field] = new Set();
        }

        dependencies[field].add(key);
      });
    }

    this.dependenciesByKey = dependencies;

    return dependencies;
  }

  getTreeOfDependencies(keys, parentKey, chain, isBranch) {
    if (isEmpty(keys)) {
      return [];
    }

    if (isString(keys)) {
      keys = [keys];
    }

    const values = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const component = this.components[key];

      if (!component) {
        continue;
      }

      const localChain = isBranch ? new Set() : chain;
      const data = { id: key, key, label: `${component.label} (${key})` };

      if (localChain.has(key) || key === parentKey) {
        this.numberOfLoops = this.numberOfLoops + 1;
        values.push({
          ...data,
          items: [],
          ...this.loopedData
        });
        break;
      }

      localChain.add(key);
      data.items = this.getTreeOfDependencies(component.refreshOn, parentKey, localChain);
      values.push({ ...data });

      localChain.clear();
    }

    return values;
  }

  getTreeOfInfluence(keys, parentKey, chain, isBranch) {
    if (isEmpty(keys)) {
      return [];
    }

    if (isString(keys)) {
      keys = [keys];
    }

    const values = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const chainLocal = isBranch ? new Set() : chain;

      if (!this.components[key]) {
        continue;
      }

      const data = {
        id: key,
        key,
        label: `${this.components[key].label} (${key})`
      };

      if (chainLocal.has(key) || key === parentKey) {
        values.push({
          ...data,
          items: [],
          ...this.loopedData
        });
        break;
      }

      chainLocal.add(key);
      data.items = this.getTreeOfInfluence([...(this.dependenciesByKey[key] || [])], parentKey, chainLocal);
      values.push({ ...data });
      chainLocal.delete(key);
    }

    return values;
  }

  getTree() {
    const dependenciesByKey = this.getDependenciesByKey(Object.keys(this.components));
    const treeOfDependencies = {};
    const treeOfInfluence = {};

    for (let i = 0; i < Object.keys(this.components).length; i++) {
      const key = Object.keys(this.components)[i];
      const component = this.components[key];

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

      treeOfDependencies[key].items = this.getTreeOfDependencies(component.refreshOn, key, dependencyChain, true);
    }

    for (let i = 0; i < Object.keys(dependenciesByKey).length; i++) {
      const key = Object.keys(dependenciesByKey)[i];
      const component = this.components[key];

      if (isEmpty(component)) {
        continue;
      }

      const influenceChain = new Set();

      if (!treeOfInfluence[key]) {
        influenceChain.add(key);
        treeOfInfluence[key] = {
          id: key,
          key,
          label: `${component.label} (${key})`,
          items: []
        };
      }

      treeOfInfluence[key].items = this.getTreeOfInfluence([...(dependenciesByKey[key] || [])], key, influenceChain, true);
    }

    this.setState({
      treeOfDependencies: Object.values(treeOfDependencies).filter(i => !isEmpty(i.items)),
      treeOfInfluence: Object.values(treeOfInfluence).filter(i => !isEmpty(i.items))
    });
  }

  onToggleInfluence = () => {
    this.setState(state => ({ isOpenInfluence: !state.isOpenInfluence }));
  };

  onToggleDependencies = () => {
    this.setState(state => ({ isOpenDependencies: !state.isOpenDependencies }));
  };

  onToggleTab = activeTab => {
    this.setState({ activeTab });
  };

  renderDependenciesTab = () => {
    const { isOpenDependencies, isOpenInfluence, treeOfDependencies, treeOfInfluence } = this.state;

    return (
      <Card>
        <CardBody>
          {this.numberOfLoops > 0 && <Alert color="danger font-weight-bold">{t(Labels.ALERT_LOOP, { count: this.numberOfLoops })}</Alert>}

          {this.numberOfLoops === 0 && <Alert color="success font-weight-bold">{t(Labels.ALERT_NOT_LOOP)}</Alert>}

          <Container>
            <Row>
              <Col md="6" sm="12" className="form-builder-modal__tree pl-0">
                <p className="form-builder-modal__tree-label" onClick={this.onToggleDependencies}>
                  <i
                    className={classNames('glyphicon formio-collapse-icon mr-2', {
                      'glyphicon-minus': isOpenDependencies,
                      'glyphicon-plus': !isOpenDependencies
                    })}
                  />
                  {t(Labels.TREE_DEPENDENCIES_LABEL)}
                </p>

                <Collapse isOpen={isOpenDependencies}>
                  <UncontrolledAlert color="primary form-builder-modal__alert_info">{t(Labels.TREE_DEPENDENCIES_INFO)}</UncontrolledAlert>
                  <div className="form-builder-modal__tree-wrapper">
                    <Tree data={treeOfDependencies} openAll />
                  </div>
                </Collapse>
              </Col>

              <Col md="6" sm="12" className="form-builder-modal__tree pr-0">
                <p className="form-builder-modal__tree-label" onClick={this.onToggleInfluence}>
                  <i
                    className={classNames('glyphicon formio-collapse-icon mr-2', {
                      'glyphicon-minus': isOpenInfluence,
                      'glyphicon-plus': !isOpenInfluence
                    })}
                  />
                  {t(Labels.TREE_INFLUENCE_LABEL)}
                </p>

                <Collapse isOpen={isOpenInfluence}>
                  <UncontrolledAlert color="primary">{t(Labels.TREE_INFLUENCE_INFO)}</UncontrolledAlert>
                  <div className="form-builder-modal__tree-wrapper">
                    <Tree data={treeOfInfluence} openAll />
                  </div>
                </Collapse>
              </Col>
            </Row>
          </Container>
        </CardBody>
      </Card>
    );
  };

  render() {
    const { isOpen, onClose } = this.props;
    const { activeTab } = this.state;

    return (
      <EcosModal
        reactstrapProps={{
          backdrop: 'static'
        }}
        className="ecos-modal_width-extra-lg form-builder-modal"
        title={t(Labels.DEBUG_TITLE)}
        isOpen={isOpen}
        zIndex={9001}
        hideModal={onClose}
      >
        <ErrorBoundary message={t(Labels.ERROR_BOUNDARY_MSG)}>
          <Nav tabs>
            {this.tabs.map(tab => (
              <NavItem key={tab.id}>
                <NavLink
                  className={classNames({
                    active: activeTab === tab.id
                  })}
                  onClick={() => this.onToggleTab(Tabs.DEPENDENCIES)}
                >
                  {tab.label}
                </NavLink>
              </NavItem>
            ))}
          </Nav>

          <TabContent activeTab={activeTab}>
            {this.tabs.map(tab => (
              <TabPane key={tab.id} tabId={tab.id}>
                {tab.content()}
              </TabPane>
            ))}
          </TabContent>
        </ErrorBoundary>
      </EcosModal>
    );
  }
}

export default DebugModal;
