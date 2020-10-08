import React, { useContext } from 'react';
import classNames from 'classnames';

import { Btn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { t } from '../../../../helpers/util';

import { DocPermissionsEditorContext } from '../DocPermissionsEditorContext';
import { STATUS_FIELD_NAME, DOC_PERM_READ, DOC_PERM_WRITE } from '../../constants';
import { switchDocPerm } from '../../helpers/switchDocPerm';

const DocPermissionsGrid = () => {
  const context = useContext(DocPermissionsEditorContext);
  const { matrixConfig, roles, statuses, setPermission } = context;

  const columns = [
    {
      dataField: STATUS_FIELD_NAME,
      text: ''
    }
  ].concat(
    roles.map(role => ({
      dataField: role.roleid,
      text: role.name,
      className: 'doc-permissions__column',
      formatExtraData: {
        formatter: ({ cell, row, roleId }) => {
          const docStatus = row.id;
          const permission = cell;
          const onClick = () => {
            const newPermission = switchDocPerm(permission);
            setPermission(roleId, docStatus, newPermission);
          };

          return (
            <div className={'doc-permissions__switch-buttons'}>
              <Btn
                className={classNames('ecos-btn_narrow', 'doc-permissions__switch-button', {
                  'ecos-btn_blue': permission === DOC_PERM_WRITE || permission === DOC_PERM_READ
                })}
                onClick={onClick}
              >
                {t(`doc-permissions.${String(permission).toLowerCase()}`)}
              </Btn>
            </div>
          );
        },
        roleId: role.roleid
      }
    }))
  );

  const data = statuses.map(status => {
    const rolesPermissions = {};
    roles.forEach(role => {
      const rolePermissions = matrixConfig.permissions.find(perm => perm.role === role.roleid);
      rolesPermissions[role.roleid] = rolePermissions.statuses[status.id];
    });

    return {
      id: status.id,
      [STATUS_FIELD_NAME]: status.name,
      ...rolesPermissions
    };
  });

  const calcMaxHeight = () => {
    return window.innerHeight - 200;
  };

  return (
    <div className="doc-permissions__grid-container">
      <Grid autoHeight maxHeight={calcMaxHeight()} fixedHeader data={data} columns={columns} className="doc-permissions__grid" />
    </div>
  );
};

export default DocPermissionsGrid;
