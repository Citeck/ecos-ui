import React from 'react';
import UserProfileDashlet from '../../components/widgets/UserProfile/UserProfileDashlet';
import PropertiesDashlet from '../../components/widgets/Properties/PropertiesDashlet';
import get from 'lodash/get';
import { connect } from 'react-redux';

import './style.scss';
import Search from '../../components/common/form/SelectOrgstruct/components/SelectModal/Search';
import { SelectOrgstructProvider } from '../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import { OrgStructApi } from '../../api/orgStruct';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import SelectOrgstructRoot from '../../components/common/form/SelectOrgstruct/components/SelectOrgstructRoot';
import Structure from './components/Structure';

const DASHBOARD_ID = 'person-dashboard';

const orgStructApi = new OrgStructApi();

const mapStateToProps = state => {
  const recordRef = get(state, ['user', 'recordRef']);

  return { recordRef };
};

const controlProps = {
  defaultValue: [],
  dataType: '',
  onChange: () => {},
  onError: () => {},
  multiple: true,
  isCompact: true,
  isIncludedAdminGroup: true
};

class Orgstructure extends React.Component {
  render() {
    const { recordRef } = this.props;
    const config = [
      { formId: 'uiserv/form@person_general', title: 'Основное' },
      { formId: 'uiserv/form@person_contacts', title: 'Контакты' },
      { formId: 'uiserv/form@person_other', title: 'Прочее' },
      { formId: 'uiserv/form@cm_person_user_groups', title: 'Группы' }
    ];
    // БАГ с нажатием на редактировать - разобраться
    return (
      <div className="orgstructure-page__grid__container">
        <div className="orgstructure-page__grid__main">
          <Structure />
        </div>
        <div className="orgstructure-page__grid__widgets">
          <UserProfileDashlet record={recordRef} />
          {config.map(element => (
            <PropertiesDashlet
              recordRef={recordRef}
              dashboardId={DASHBOARD_ID}
              id={element.formId}
              config={{ formId: element.formId, titleAsFormName: true }}
              title={element.title}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Orgstructure);

/* 

            {config.map(element => (
                <PropertiesDashlet
                  recordRef={recordRef}
                  dashboardId={DASHBOARD_ID}
                  config={{ formId: element.formId, titleAsFormName: true }}
                  title={element.title}
                />
              ))}

*/

/* 

  <PropertiesDashlet
            record={recordRef}
            dashboardId={DASHBOARD_ID}
            config={{ formId: "uiserv/form@person_general", titleAsFormName: true }}
            title="Основное"
          />
          <PropertiesDashlet
            record={recordRef}
            dashboardId={DASHBOARD_ID}
            config={{ formId: "uiserv/form@person_contacts", titleAsFormName: true }}
            title="Контакты"
          />
          <PropertiesDashlet
            record={recordRef}
            dashboardId={DASHBOARD_ID}
            config={{ formId: "uiserv/form@person_other", titleAsFormName: true }}
            title="Прочее"
          />
          <PropertiesDashlet
            record={recordRef}
            dashboardId={DASHBOARD_ID}
            config={{ formId: "uiserv/form@cm_person_user_groups", titleAsFormName: true }}
            title="Группы"
          />
          */
