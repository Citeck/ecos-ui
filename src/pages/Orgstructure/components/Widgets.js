import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';

import UserProfileDashlet from '../../../components/widgets/UserProfile/UserProfileDashlet';
import PropertiesDashlet from '../../../components/widgets/Properties/PropertiesDashlet';
import { t } from '../../../helpers/util';

const mapStateToProps = state => {
  const personId = get(state, ['orgstructure', 'id']);

  return { personId };
};

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
  const update = () => true;
  const refOnDashlet = React.createRef();
  useEffect(() => {
    // if (personId && refOnDashlet && refOnDashlet.current) {
    //   const onReload = get(refOnDashlet, "current.wrappedInstance._ecosForm.onReload");
    //   onReload();
    // }
  }, [personId]);

  if (!personId) {
    return <div className="orgstructure-page__grid__empty-widgets">{t(Labels.NO_DATA_TEXT)}</div>;
  }

  return (
    <div className="orgstructure-page__grid__widgets">
      <UserProfileDashlet record={personId} onUpdate={update} />
      {WIDGETS_CONFIG.map(element => (
        <PropertiesDashlet
          record={personId}
          dashboardId={DASHBOARD_ID}
          id={element.formId}
          config={{ formId: element.formId, titleAsFormName: true }}
          title={element.title}
          onUpdate={update}
          ref={refOnDashlet}
        />
      ))}
    </div>
  );
};

export default connect(mapStateToProps)(Widgets);
