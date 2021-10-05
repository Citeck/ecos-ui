import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { MenuSettings as MS } from '../../../constants/menu';
import { SelectJournal } from '../../common/form';

import Section from './Section';
import Arbitrary from './Arbitrary';
import Divider from './Divider';
import CreateInSection from './CreateInSection';
import EditRecord from './EditRecord';
import LinkCreateCase from './LinkCreateCase';
import UserMenuItem from './UserMenuItem';

import '../style.scss';

export default class EditorItem extends React.Component {
  static propTypes = {
    fontIcons: PropTypes.array,
    type: PropTypes.object,
    item: PropTypes.object,
    onClose: PropTypes.func,
    onSave: PropTypes.func
  };

  render() {
    switch (get(this, 'props.type.key')) {
      case MS.ItemTypes.SECTION:
        return <Section {...this.props} />;
      case MS.ItemTypes.ARBITRARY:
        return <Arbitrary {...this.props} />;
      case MS.ItemTypes.HEADER_DIVIDER:
        return <Divider {...this.props} />;
      case MS.ItemTypes.CREATE_IN_SECTION:
        return <CreateInSection {...this.props} />;
      case MS.ItemTypes.EDIT_RECORD:
        return <EditRecord {...this.props} />;
      case MS.ItemTypes.LINK_CREATE_CASE: {
        return <LinkCreateCase {...this.props} />;
      }
      case MS.ItemTypes.JOURNAL: {
        const { onSave, onClose, journalId } = this.props;

        return (
          <SelectJournal onChange={onSave} onCancel={onClose} journalId={journalId} renderView={() => null} isSelectModalOpen multiple />
        );
      }
      case MS.ItemTypes.USER_LOGOUT:
      case MS.ItemTypes.USER_SEND_PROBLEM_REPORT:
      case MS.ItemTypes.USER_FEEDBACK:
      case MS.ItemTypes.USER_CHANGE_PASSWORD:
      case MS.ItemTypes.USER_STATUS:
      case MS.ItemTypes.USER_PROFILE: {
        return (
          <UserMenuItem
            {...this.props}
            item={{
              ...get(this.props, 'type.default', {}),
              ...get(this.props, 'item', {})
            }}
          />
        );
      }
      default:
        return null;
    }
  }
}
