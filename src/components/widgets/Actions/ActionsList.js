import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';

import { InfoText, Loader, Separator, Tooltip } from '../../common/index';
import { t } from '../../../helpers/util';

class ActionsList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    executeAction: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    list: [],
    isMobile: false,
    isLoading: false,
    executeAction: () => null
  };

  onClick = action => {
    const { executeAction, isLoading } = this.props;

    if (!isLoading) {
      executeAction(action);
    }
  };

  renderVariant = (action, variant, postfix) => {
    const { isLoading } = this.props;
    const id = `variant-action-${action.type}-${variant.type}-${postfix}`;

    return (
      <Tooltip showAsNeeded key={id} target={id} uncontrolled text={variant.name}>
        <div
          id={id}
          className={classNames('ecos-actions-list__item-variants__item', {
            'ecos-actions-list__item-variants__item_disabled': isLoading
          })}
          onClick={() => this.onClick(action)}
        >
          {variant.name}
        </div>
      </Tooltip>
    );
  };

  render() {
    const { isLoading, list = [], isMobile, forwardedRef } = this.props;

    return (
      <div className="ecos-actions-list" ref={forwardedRef}>
        {isLoading && <Loader className="ecos-actions-list__loader" blur />}
        {!isLoading && isEmpty(list) && <InfoText className="ecos-actions-list__text-empty" text={t('records-actions.no-available')} />}
        {Array.isArray(list) &&
          list.map((action, index) => {
            const hasVariants = !isEmpty(action.variants);
            const id = `action-${action.type}-${index}`;

            return (
              <div
                key={id}
                className={classNames(
                  'ecos-actions-list__item',
                  { 'ecos-actions-list__item_group': hasVariants },
                  { 'ecos-actions-list__item_disabled': isLoading },
                  { 'ecos-actions-list__item_warning': action.theme }
                )}
                onClick={() => (hasVariants ? null : this.onClick(action))}
              >
                <Tooltip showAsNeeded target={id} uncontrolled text={action.name}>
                  <div id={id} className="ecos-actions-list__item-title">
                    {action.name}
                  </div>
                </Tooltip>
                {hasVariants && (
                  <div className="ecos-actions-list__item-variants">
                    {!isEmpty(action.variants) &&
                      action.variants.map((variant, position) => this.renderVariant(action, variant, `${index}-${position}`))}
                  </div>
                )}
                {isMobile && index < list.length - 1 && !hasVariants && <Separator noIndents />}
              </div>
            );
          })}
      </div>
    );
  }
}

export default ActionsList;
