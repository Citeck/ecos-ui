import isFunction from 'lodash/isFunction';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'reactstrap';

import { Labels } from '../../../constants/bpmn';
import { t } from '../../../helpers/export/util';
import { PointsLoader } from '../../common';
import { Dropdown } from '../../common/form';

import '../style.scss';

const ControlPanel = ({
  createModel,
  totalCount,
  getTotalCount,
  isReady,
  createVariants,
  SearchComponent,
  ViewSwitcherComponent,
  canCreateDef
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);

      isFunction(getTotalCount) && getTotalCount();
    }
  }, []);

  const handlerCreateVariant = variant => {
    createModel(variant);
  };

  const hasLoading = totalCount === null;

  return (
    <div className="mb-3 ecos-designer-control-panel">
      <Row noGutters>
        <Col lg={6} md={12}>
          {canCreateDef && (
            <Dropdown
              hasEmpty
              isStatic
              source={createVariants}
              valueField="id"
              titleField="name"
              onChange={handlerCreateVariant}
              controlIcon="icon-small-plus"
              controlClassName="ecos-btn_settings-down ecos-btn_white ecos-btn_hover_gray"
            />
          )}
          <SearchComponent />
        </Col>
        <Col lg={6} md={12}>
          <div className="ecos-designer-control-panel__side-right">
            {isReady && (
              <div className="ecos-designer-control-panel__counter">
                {t(Labels.TOTAL)} {hasLoading ? <PointsLoader /> : totalCount}
              </div>
            )}
            <ViewSwitcherComponent />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ControlPanel;
