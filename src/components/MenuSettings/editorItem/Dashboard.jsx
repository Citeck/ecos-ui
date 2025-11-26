import React from 'react';
import uuidV4 from 'uuidv4';

import { t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { DashboardApi } from '../../../api/dashboard';
import { notifyFailure } from '../../Records/actions/util/actionUtils';
import { MLText } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
import Base from './Base';

const dashboardApi = new DashboardApi();

export default class Dashboard extends Base {
  type = MenuSettings.ItemTypes.DASHBOARD;

  componentDidMount() {
    super.componentDidMount();
    const { config, label } = this.props.item || {};
    const { dashboardId } = config || {};

    this.setState({ dashboardId, label });
  }

  handleApply() {
    super.handleApply();

    const { onSave, config = {} } = this.props;
    const { dashboardId, label } = this.state;

    this.data.label = label;

    this.toggleIsloading(true);

    if (!dashboardId) {
      dashboardApi.createCustomDashboard({
        name: label,
        id: uuidV4(),
        onSave: response => {
          this.data.config = {
            ...config,
            dashboardId: response.id
          };

          this.toggleIsloading(false);
          onSave(this.data);
        },
        onFailure: e => {
          notifyFailure(e);

          this.toggleIsloading(false);
          onSave(this.data);
        }
      });

      return;
    }
  }

  isInvalidForm() {
    return this.isInvalidLabel;
  }

  setLabel = label => {
    this.setState({ label });
  };

  render() {
    const { label } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)}>
          <MLText onChange={this.setLabel} value={label} />
        </Field>
      </this.wrapperModal>
    );
  }
}
