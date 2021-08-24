import React from 'react';
import classNames from 'classnames';

import { Btn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { t } from '../../../../helpers/util';

import { TypePermissionsEditorContext } from '../TypePermissionsEditorContext';
import { STATUS_FIELD_NAME, TYPE_PERM_NONE, TYPE_PERM_WRITE } from '../../constants';
import { switchTypePerm } from '../../helpers/switchTypePerm';

class TypePermissionsGrid extends React.PureComponent {
  get maxHeight() {
    return window.innerHeight - 200;
  }

  get data() {
    const { matrixConfig, roles, statuses } = this.context;

    return statuses.map(status => {
      const rolesPermissions = {};
      roles.forEach(role => {
        const rolePermissions = matrixConfig[role.id] || {};

        rolesPermissions[role.id] = rolePermissions[status.id] || 'READ';
      });

      return {
        id: status.id,
        [STATUS_FIELD_NAME]: status.name || status.id,
        ...rolesPermissions
      };
    });
  }

  get columns() {
    const { roles } = this.context;

    return [
      {
        dataField: STATUS_FIELD_NAME,
        text: ''
      }
    ].concat(
      roles.map(role => ({
        dataField: role.id,
        text: role.name || role.id,
        className: 'type-permissions__column',
        formatExtraData: {
          formatter: this.renderFormatter,
          roleId: role.id
        }
      }))
    );
  }

  handleClick = (roleId, docStatus, permission) => {
    const { setPermission } = this.context;
    const newPermission = switchTypePerm(permission);

    setPermission(roleId, docStatus, newPermission);
  };

  renderFormatter = ({ cell, row, roleId }) => (
    <div className={'type-permissions__switch-buttons'}>
      <Btn
        className={classNames('ecos-btn_narrow', 'type-permissions__switch-button', {
          'ecos-btn_blue': cell === TYPE_PERM_WRITE,
          'ecos-btn_grey-dark': cell === TYPE_PERM_NONE
        })}
        onClick={() => this.handleClick(roleId, row.id, cell)}
      >
        {t(`type-permissions.${String(cell).toLowerCase()}`)}
      </Btn>
    </div>
  );

  render() {
    return (
      <div className="type-permissions__grid-container">
        <Grid
          resizableColumns={false}
          autoHeight
          maxHeight={this.maxHeight}
          fixedHeader
          data={this.data}
          columns={this.columns}
          className="type-permissions__grid"
        />
      </div>
    );
  }
}

TypePermissionsGrid.contextType = TypePermissionsEditorContext;

export default TypePermissionsGrid;
