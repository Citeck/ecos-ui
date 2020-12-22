import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';

import { showImportModelForm, showModelCreationForm } from '../../../actions/bpmn';
import { BPMNDesignerService } from '../../../services/BPMNDesignerService';
import { Dropdown } from '../../common/form';
import { IcoBtn } from '../../common/btns';
import Search from './Search';
import ViewSwitcher from './ViewSwitcher';

import '../style.scss';

const ControlPanel = ({ isMobile, showModelCreationForm, showImportModelForm }) => {
  const createVariants = BPMNDesignerService.getCreateVariants();

  const handlerCreateVariant = variant => {
    if (variant.id === 'bpmn-designer-create-model') {
      showModelCreationForm();
    } else if (variant.id === 'bpmn-designer-import-model') {
      showImportModelForm();
    } else {
      console.warn('Unknown variant');
    }
  };

  return (
    <div className="mb-3 bpmn-designer-control-panel">
      <Row noGutters>
        <Col lg={6} md={12}>
          <Dropdown
            hasEmpty
            isStatic
            source={createVariants}
            valueField="id"
            titleField="title"
            onChange={handlerCreateVariant}
            controlIcon="icon-small-plus"
            controlClassName="ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          />
          <Search />
          <IcoBtn
            icon={'icon-reload'}
            className={classNames('ml-4', {
              'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue': !isMobile,
              'ecos-btn_i ecos-btn_white': isMobile
            })}
            onClick={() => {}}
          />
        </Col>
        <Col lg={6} md={12}>
          <div className="bpmn-designer-control-panel__side-right">
            {/*<SortFilter />*/}
            <ViewSwitcher />
          </div>
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = state => ({
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  showModelCreationForm: () => dispatch(showModelCreationForm()),
  showImportModelForm: () => dispatch(showImportModelForm())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
