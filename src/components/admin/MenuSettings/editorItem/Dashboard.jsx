import { MenuSettings } from '@citeck/constants/menu';
import React from 'react';
import uuidV4 from 'uuidv4';

import { DashboardApi } from '@/api/dashboard';
import { t } from '@/helpers/util';
import { notifyFailure } from '@/components/core/Records/actions/util/actionUtils';
import { MLText } from '@/components/common/form';
import { Field } from '../Field';
import { Labels } from '../utils';

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
