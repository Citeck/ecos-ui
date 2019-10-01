import React from 'react';

import { deepClone, t } from '../../helpers/util';
import { CommonLabels, DelegateTimesheetLabels, StatusCategories, Statuses } from '../../helpers/timesheet/constants';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { DateSlider, Tabs } from '../../components/Timesheet';
import Timesheet from '../../components/Timesheet/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { Btn } from '../../components/common/btns';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class DelegatedTimesheetsPage extends React.Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    const eventTypes = timesheetApi.getEventTypes();

    this.cacheDays = new Map();
    this.state = {
      eventTypes,
      subordinatesEvents: timesheetApi.getSubordinatesEvents(),
      sheetTabs: timesheetApi.getSheetTabs(this.isOnlyContent, location),
      statusTabs: timesheetApi.getStatuses(StatusCategories.FILL),
      dateTabs: [
        {
          name: 'Месяц',
          isActive: true,
          isAvailable: true
        },
        {
          name: 'Год',
          isActive: false,
          isAvailable: false
        }
      ],
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      currentStatus: Statuses.NEED_IMPROVED,
      isDelegated: false,
      delegatedTo: '',
      delegationRejected: true,
      categoryDelegatedTabs: timesheetApi.getDelegatedCategories()
    };
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  get selectedCategory() {
    const { categoryDelegatedTabs } = this.state;

    return (categoryDelegatedTabs.find(item => item.isActive) || {}).category;
  }

  getDaysOfMonth = currentDate => {
    return getDaysOfMonth(currentDate);
  };

  handleChangeActiveSheetTab = tabIndex => {
    const sheetTabs = deepClone(this.state.sheetTabs);

    sheetTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        changeUrlLink(tab.link);
      }
    });

    this.setState({ sheetTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) });
  };

  handleChangeCategoryTab = tabIndex => {
    const categoryDelegatedTabs = deepClone(this.state.categoryDelegatedTabs);
    let selectedCategory = '';

    categoryDelegatedTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        selectedCategory = tab.category;
      }
    });

    const statusTabs = timesheetApi.getStatuses(selectedCategory);

    this.setState({ categoryDelegatedTabs, statusTabs });
  };

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs });
  };

  renderCategoryTimesheet = () => {
    const { subordinatesEvents, daysOfMonth, isDelegated } = this.state;

    switch (this.selectedCategory) {
      case StatusCategories.FILL:
        return (
          <Timesheet
            groupBy={'user'}
            category={StatusCategories.FILL}
            eventTypes={subordinatesEvents}
            daysOfMonth={daysOfMonth}
            isAvailable={!isDelegated}
            onChange={this.handleChangeTimesheet}
            lockedMessage={this.lockDescription}
          />
        );
      case StatusCategories.APPROVE:
        return (
          <Timesheet
            groupBy={'user'}
            category={StatusCategories.APPROVE}
            eventTypes={subordinatesEvents}
            daysOfMonth={daysOfMonth}
            isAvailable={!isDelegated}
            onChange={this.handleChangeTimesheet}
            lockedMessage={this.lockDescription}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { sheetTabs, currentDate, statusTabs, categoryDelegatedTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          {this.selectedCategory === StatusCategories.APPROVE && (
            <div className="ecos-timesheet__column ecos-timesheet__delegation">
              <div className="ecos-timesheet__delegation-title">
                {t(CommonLabels.HEADLINE_DELEGATION)}
                <Btn className="ecos-timesheet__delegation-btn-set ecos-btn_grey7 ecos-btn_narrow">
                  {t(DelegateTimesheetLabels.DELEGATION_BTN_SET)}
                </Btn>
              </div>

              <div className="ecos-timesheet__delegation-label">{DelegateTimesheetLabels.DELEGATION_DESCRIPTION_1}</div>
            </div>
          )}
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__header-box">
            <div className="ecos-timesheet__white-block">
              <Tabs tabs={categoryDelegatedTabs} isSmall onClick={this.handleChangeCategoryTab} />
            </div>
            <div className="ecos-timesheet__date-settings">
              <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
            </div>
          </div>

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} />
          </div>
        </div>
        {this.renderCategoryTimesheet()}
      </div>
    );
  }
}

export default DelegatedTimesheetsPage;
