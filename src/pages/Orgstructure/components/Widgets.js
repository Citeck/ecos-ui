import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import UserProfileDashlet from '../../../components/widgets/UserProfile/UserProfileDashlet';
import PropertiesDashlet from '../../../components/widgets/Properties/PropertiesDashlet';
import { t } from '../../../helpers/util';

const Labels = {
  NO_DATA_TEXT: 'orgstructure-page-no-picked-person-text',
  GENERAL_TITLE: 'orgstructure-widget-main',
  CONTACTS_TITLE: 'orgstructure-widget-contacts',
  OTHER_TITLE: 'orgstructure-widget-others',
  GROUPS_TITLE: 'orgstructure-widget-groups'
};

const WIDGETS_CONFIG = {
  GENERAL: { formId: 'uiserv/form@person_general', title: t(Labels.GENERAL_TITLE) },
  CONTACTS: { formId: 'uiserv/form@person_contacts', title: t(Labels.CONTACTS_TITLE) },
  OTHER: { formId: 'uiserv/form@person_other', title: t(Labels.OTHER_TITLE) },
  GROUPS: { formId: 'uiserv/form@cm_person_user_groups', title: t(Labels.GROUPS_TITLE) }
};

const DASHBOARD_ID = 'person-dashboard';

const renderWidget = (element, record) => {
  return (
    <PropertiesDashlet
      record={record}
      dashboardId={DASHBOARD_ID}
      id={element.formId}
      config={{ formId: element.formId, titleAsFormName: true }}
      title={element.title}
    />
  );
};

const Widgets = ({ personId }) => {
  if (!personId) {
    return <div className="orgstructure-page__grid-empty-widgets">{t(Labels.NO_DATA_TEXT)}</div>;
  }

  return (
    <div className="orgstructure-page__grid-widgets">
      <div className="orgstructure-page__grid-widgets-block">
        <UserProfileDashlet record={personId} />
        {renderWidget(WIDGETS_CONFIG.OTHER, personId)}
      </div>
      <div className="orgstructure-page__grid-widgets-block">
        {renderWidget(WIDGETS_CONFIG.GENERAL, personId)}
        {renderWidget(WIDGETS_CONFIG.GROUPS, personId)}
      </div>
      <div className="orgstructure-page__grid-widgets-block">{renderWidget(WIDGETS_CONFIG.CONTACTS, personId)}</div>
    </div>
  );
};

const mapStateToProps = state => {
  const { id } = get(state, ['orgstructure']);

  return { personId: id };
};

export default connect(mapStateToProps)(Widgets);
