import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import UserProfileDashlet from '../../../components/widgets/UserProfile/UserProfileDashlet';
import PropertiesDashlet from '../../../components/widgets/Properties/PropertiesDashlet';
import { t } from '../../../helpers/util';

const WIDGETS_CONFIG = [
  { formId: 'uiserv/form@person_general', title: 'Основное' },
  { formId: 'uiserv/form@person_contacts', title: 'Контакты' },
  { formId: 'uiserv/form@person_other', title: 'Прочее' },
  { formId: 'uiserv/form@cm_person_user_groups', title: 'Группы' }
];

const DASHBOARD_ID = 'person-dashboard';

const Labels = {
  NO_DATA_TEXT: 'orgstructure-page-no-picked-person-text'
};

const Widgets = ({ personId }) => {
  if (!personId) {
    return <div className="orgstructure-page__grid__empty-widgets">{t(Labels.NO_DATA_TEXT)}</div>;
  }

  return (
    <div className="orgstructure-page__grid__widgets">
      <UserProfileDashlet record={personId} />

      {WIDGETS_CONFIG.map(element => (
        <PropertiesDashlet
          record={personId}
          dashboardId={DASHBOARD_ID}
          id={element.formId}
          config={{ formId: element.formId, titleAsFormName: true }}
          title={element.title}
        />
      ))}
    </div>
  );
};

const mapStateToProps = state => {
  const { id } = get(state, ['orgstructure']);

  return { personId: id };
};

export default connect(mapStateToProps)(Widgets);
