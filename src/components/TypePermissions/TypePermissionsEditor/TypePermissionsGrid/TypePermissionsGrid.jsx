import React, { useContext } from 'react';
import classNames from 'classnames';

import { Btn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { t } from '../../../../helpers/util';

import { TypePermissionsEditorContext } from '../TypePermissionsEditorContext';
import { STATUS_FIELD_NAME, TYPE_PERM_READ, TYPE_PERM_WRITE } from '../../constants';
import { switchTypePerm } from '../../helpers/switchTypePerm';

const TypePermissionsGrid = () => {
  const context = useContext(TypePermissionsEditorContext);
  const { matrixConfig, roles, statuses, setPermission } = context;

  const columns = [
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
        formatter: ({ cell, row, roleId }) => {
          const docStatus = row.id;
          const permission = cell;
          const onClick = () => {
            const newPermission = switchTypePerm(permission);
            setPermission(roleId, docStatus, newPermission);
          };

          return (
            <div className={'type-permissions__switch-buttons'}>
              <Btn
                className={classNames('ecos-btn_narrow', 'type-permissions__switch-button', {
                  'ecos-btn_blue': permission === TYPE_PERM_WRITE || permission === TYPE_PERM_READ
                })}
                onClick={onClick}
              >
                {t(`type-permissions.${String(permission).toLowerCase()}`)}
              </Btn>
            </div>
          );
        },
        roleId: role.id
      }
    }))
  );

  const data = statuses.map(status => {
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

  const calcMaxHeight = () => {
    return window.innerHeight - 200;
  };

  return (
    <div className="type-permissions__grid-container">
      <Grid autoHeight maxHeight={calcMaxHeight()} fixedHeader data={data} columns={columns} className="type-permissions__grid" />
    </div>
  );
};

export default TypePermissionsGrid;
