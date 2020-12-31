import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { getId } from '../../helpers/util';
import { Icon } from '../common';

import './style.scss';

class ScenarioManager extends React.Component {
  state = {
    propertiesOpen: false,
    stateId: 'ecos-scenario-manager' + getId()
  };

  togglePropertiesOpen = () => {
    this.setState(({ propertiesOpen }) => ({ propertiesOpen: !propertiesOpen }));
  };

  render() {
    const { propertiesOpen, stateId } = this.state;
    const { record, formId } = this.props;

    return (
      <div className="ecos-scenario-manager">
        <div className="ecos-scenario-manager__designer">{/*контейнер для bpmn/cmmn*/}</div>
        <div className={classNames('ecos-scenario-manager__properties', { 'ecos-scenario-manager__properties_open': propertiesOpen })}>
          <div className="ecos-scenario-manager__properties-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !propertiesOpen, 'icon-small-right': propertiesOpen })} />
          </div>
          {/*<EcosForm*/}
          {/*  record={record}*/}
          {/*  formId={formId}*/}
          {/*  options={{*/}
          {/*    viewAsHtml: true,*/}
          {/*    formMode: FORM_MODE_EDIT,*/}
          {/*    onInlineEditSave: true*/}
          {/*  }}*/}
          {/*/>*/}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {};

const mapDispatchToProps = (dispatch, props) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScenarioManager);
