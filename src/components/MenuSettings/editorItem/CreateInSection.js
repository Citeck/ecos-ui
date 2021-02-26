import React from 'react';
import { connect } from 'react-redux';
import set from 'lodash/set';
import get from 'lodash/get';

import { extractLabel, t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { Select } from '../../common/form';
import { Labels } from './../utils';
import { Field } from './../Field';
import Base from './Base';

class CreateInSection extends Base {
  type = MenuSettings.ItemTypes.CREATE_IN_SECTION;

  componentDidMount() {
    super.componentDidMount();
    const sectionId = get(this.props, 'item.config.sectionId');
    this.setState({ sectionId });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { sectionId, label } = this.state;

    set(this.data, 'config.sectionId', sectionId);
    this.data.label = label;

    onSave(this.data);
  }

  isNotValid() {
    const { sectionId } = this.state;

    return !sectionId;
  }

  setSection = section => {
    this.setState({ sectionId: section.id, label: section.label });
  };

  render() {
    const { availableSections } = this.props;
    const { sectionId } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_SECTION_ID)} required>
          <Select
            value={availableSections.find(item => item.id === sectionId)}
            onChange={this.setSection}
            options={availableSections}
            isSearchable
            getOptionLabel={option => extractLabel(option.breadcrumbs)}
            getOptionValue={option => option.id}
          />
        </Field>
      </this.wrapperModal>
    );
  }
}

const mapStateToProps = state => ({
  availableSections: get(state, 'menuSettings.availableSections', [])
});

export default connect(mapStateToProps)(CreateInSection);
