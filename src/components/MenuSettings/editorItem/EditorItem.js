import get from 'lodash/get';
import PropTypes from 'prop-types';
import React from 'react';

import { MenuSettings as MS } from '../../../constants/menu';
import { SelectJournal } from '../../common/form';

import Arbitrary from './Arbitrary';
import CreateInSection from './CreateInSection';
import Dashboard from './Dashboard';
import Divider from './Divider';
import EditRecord from './EditRecord';
import LinkCreateCase from './LinkCreateCase';
import Section from './Section';
import StartWorkflow from './StartWorkflow';
import UserMenuItem from './UserMenuItem';

import '../style.scss';

export default class EditorItem extends React.Component {
  static propTypes = {
    fontIcons: PropTypes.array,
    presetFilterPredicates: PropTypes.array,
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
      case MS.ItemTypes.DASHBOARD:
      case MS.ItemTypes.WIKI:
        return <Dashboard {...this.props} />;
      case MS.ItemTypes.HEADER_DIVIDER:
        return <Divider {...this.props} />;
      case MS.ItemTypes.CREATE_IN_SECTION:
        return <CreateInSection {...this.props} />;
      case MS.ItemTypes.EDIT_RECORD:
        return <EditRecord {...this.props} />;
      case MS.ItemTypes.LINK_CREATE_CASE: {
        return <LinkCreateCase {...this.props} />;
      }
      case MS.ItemTypes.START_WORKFLOW: {
        return <StartWorkflow {...this.props} />;
      }
      case MS.ItemTypes.JOURNAL:
      case MS.ItemTypes.KANBAN:
      case MS.ItemTypes.PREVIEW_LIST:
      case MS.ItemTypes.DOCLIB: {
        const { onSave, onClose, journalId, presetFilterPredicates } = this.props;

        return (
          <SelectJournal
            onChange={onSave}
            onCancel={onClose}
            journalId={journalId}
            presetFilterPredicates={presetFilterPredicates}
            renderView={() => null}
            isSelectModalOpen
            multiple
          />
        );
      }
      case MS.ItemTypes.USER_LOGOUT:
      case MS.ItemTypes.USER_SEND_PROBLEM_REPORT:
      case MS.ItemTypes.USER_FEEDBACK:
      case MS.ItemTypes.USER_CHANGE_PASSWORD:
      case MS.ItemTypes.USER_STATUS:
      case MS.ItemTypes.USER_PROFILE: {
        return <UserMenuItem {...this.props} />;
      }
      default:
        console.warn('unknown type menu item ', get(this, 'props.type'));
        return null;
    }
  }
}
