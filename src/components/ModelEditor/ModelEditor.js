import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { getTitle } from '../../actions/modelEditor';
import { isExistValue, t } from '../../helpers/util';
import EcosForm from '../EcosForm';
import { Icon, InfoText } from '../common';
import { Caption } from '../common/form';
import { Btn } from '../common/btns';
import TitlePageLoader from '../common/TitlePageLoader';

import './style.scss';

const Labels = {
  APPLY: 'APPLY'
};

class ModelEditor extends React.Component {
  static propTypes = {
    record: PropTypes.string,
    type: PropTypes.string
  };

  state = {
    propertiesOpen: false
  };

  modelEditorRef = React.createRef();

  componentDidMount() {
    this.props.getTitle();
  }

  togglePropertiesOpen = () => {
    this.setState(({ propertiesOpen }) => ({ propertiesOpen: !propertiesOpen }));
  };

  onApply = () => {};

  render() {
    const { propertiesOpen } = this.state;
    const { isMobile, record, type, children, title } = this.props;
    const formId = `uiserv/eform@proc-activity-${type}`;
    const elEditor = this.modelEditorRef.current;
    const indentation = elEditor ? elEditor.getBoundingClientRect().top : 100;

    return (
      <div ref={this.modelEditorRef} className="ecos-model-editor" style={{ maxHeight: `calc(100vh - ${indentation}px)` }}>
        <div className="ecos-model-editor__designer-content">
          <TitlePageLoader isReady={isExistValue(title)}>
            <Caption normal className={classNames('journals-head__caption', { 'journals-head__caption_small': isMobile })}>
              {title}
            </Caption>
          </TitlePageLoader>

          <div className="ecos-model-editor__designer-child">
            {!record && <InfoText className="ecos-model-editor__info" text={'No Record Ref'} />}
            {!children && <InfoText className="ecos-model-editor__info" text={'No According Editor'} />}
            {children}
          </div>
          <div className="ecos-model-editor__designer-buttons">
            <Btn className="ecos-btn_blue" onClick={this.onApply}>
              {t(Labels.APPLY)}
            </Btn>
          </div>
        </div>
        <div className={classNames('ecos-model-editor__properties', { 'ecos-model-editor__properties_open': propertiesOpen })}>
          <div className="ecos-model-editor__properties-opener" onClick={this.togglePropertiesOpen}>
            <Icon className={classNames({ 'icon-small-left': !propertiesOpen, 'icon-small-right': propertiesOpen })} />
          </div>
          <div className="ecos-model-editor__properties-content">
            {record && <EcosForm formId={'uiserv/eform@e45afae4-a970-420e-b3f0-7f4888e2fb83'} record={record} options={{}} />}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (store, props) => {
  const stateId = 'ecos-model-editor' + props.record;
  const ownStore = store.modelEditor[stateId] || {};

  return {
    isMobile: store.view.isMobile,
    stateId,
    title: ownStore.title
  };
};
const mapDispatchToProps = (dispatch, props) => {
  const stateId = 'ecos-model-editor' + props.record;

  return {
    getTitle: () => dispatch(getTitle({ stateId, record: props.record }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ModelEditor);
