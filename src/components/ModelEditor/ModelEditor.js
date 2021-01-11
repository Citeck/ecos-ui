import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { getTitle } from '../../actions/modelEditor';
import { isExistValue } from '../../helpers/util';
import EcosForm, { FORM_MODE_EDIT } from '../EcosForm';
import { Icon, InfoText } from '../common';
import { Caption } from '../common/form';
import TitlePageLoader from '../common/TitlePageLoader';

import './style.scss';

class ModelEditor extends React.Component {
  state = {
    propertiesOpen: false
  };

  componentDidMount() {
    this.props.getTitle();
  }

  togglePropertiesOpen = () => {
    this.setState(({ propertiesOpen }) => ({ propertiesOpen: !propertiesOpen }));
  };

  render() {
    const { propertiesOpen } = this.state;
    const { isMobile, record, type, children, title } = this.props;
    const formId = `uiserv/eform@proc-activity-${type}`;

    return (
      <div className="ecos-model-editor">
        <div className="ecos-model-editor__designer-content">
          <TitlePageLoader isReady={isExistValue(title)}>
            <Caption normal className={classNames('journals-head__caption', { 'journals-head__caption_small': isMobile })}>
              {title}
            </Caption>
          </TitlePageLoader>

          {!record && <InfoText text={'No Record Ref'} />}
          {!children && <InfoText text={'No According Editor'} />}
          <div className="ecos-model-editor__designer-child">{children}</div>
        </div>
        <div className={classNames('ecos-model-editor__properties', { 'ecos-model-editor__properties_open': propertiesOpen })}>
          <div className="ecos-model-editor__properties-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !propertiesOpen, 'icon-small-right': propertiesOpen })} />
          </div>
          <div className="ecos-model-editor__properties-content">
            {record && (
              <EcosForm
                formId={'uiserv/eform@income-package-form'}
                record={record}
                options={{
                  viewAsHtml: true,
                  formMode: FORM_MODE_EDIT,
                  onInlineEditSave: true
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (store, props) => {
  const stateId = 'ecos-model-editor' + props.recordRef;
  const ownStore = store.modelEditor[stateId] || {};

  return {
    isMobile: store.view.isMobile,
    stateId,
    title: ownStore.title
  };
};
const mapDispatchToProps = (dispatch, props) => {
  const stateId = 'ecos-model-editor' + props.recordRef;

  return {
    getTitle: () => dispatch(getTitle({ stateId }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModelEditor);
