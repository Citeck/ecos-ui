import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { UncontrolledTooltip } from 'reactstrap';

import { InfoText, Loader, Separator, Tooltip } from '../../common/index';
import { t } from '../../../helpers/util';

class ActionsList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    executeAction: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onActionsChanged: PropTypes.func
  };

  static defaultProps = {
    list: [],
    isMobile: false,
    isLoading: false,
    executeAction: () => null
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (JSON.stringify(prevProps.list) !== JSON.stringify(this.props.list)) {
      this.props.onActionsChanged();
    }
  }

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
      <React.Fragment key={id}>
        <Tooltip
          id={id}
          uncontrolled
          ForComponent={() => (
            <div
              id={id}
              className={classNames('ecos-actions-list__item-variants__item', {
                'ecos-actions-list__item-variants__item_disabled': isLoading
              })}
              onClick={() => this.onClick(action)}
            >
              {variant.name}
            </div>
          )}
          text={variant.name}
        />
        {/*<div*/}
        {/*  id={id}*/}
        {/*  className={classNames('ecos-actions-list__item-variants__item', {*/}
        {/*    'ecos-actions-list__item-variants__item_disabled': isLoading*/}
        {/*  })}*/}
        {/*  onClick={() => this.onClick(action)}*/}
        {/*>*/}
        {/*  {variant.name}*/}
        {/*</div>*/}
        {/*<UncontrolledTooltip*/}
        {/*  placement="top"*/}
        {/*  boundariesElement="window"*/}
        {/*  className="ecos-base-tooltip"*/}
        {/*  innerClassName="ecos-base-tooltip-inner"*/}
        {/*  arrowClassName="ecos-base-tooltip-arrow"*/}
        {/*  target={id}*/}
        {/*>*/}
        {/*  {variant.name}*/}
        {/*</UncontrolledTooltip>*/}
      </React.Fragment>
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
                // onClick={() => (hasVariants ? null : this.onClick(action))}
              >
                {/*<div className="ecos-actions-list__item-title" id={id}>*/}
                {/*  {action.name}*/}
                {/*</div>*/}
                <div id={id} className="ecos-actions-list__item-title">
                  {action.name}
                </div>
                <Tooltip
                  bySize
                  target={id}
                  uncontrolled
                  ForComponent={({ forwardedRef, ...props }) => (
                    <div
                      className="ecos-actions-list__item-title"
                      ref={forwardedRef}
                      // id={id}
                      {...props}
                    >
                      {action.name}
                    </div>
                  )}
                  // ForComponent={(...props) => {
                  //   console.warn(...props);
                  //
                  //   return (
                  //     <div
                  //       className="ecos-actions-list__item-title"
                  //       {...props}
                  //     >
                  //       {action.name}
                  //     </div>
                  //   );
                  // }}
                  text={action.name}
                />
                {/*<UncontrolledTooltip*/}
                {/*  placement="top"*/}
                {/*  boundariesElement="window"*/}
                {/*  className="ecos-base-tooltip"*/}
                {/*  innerClassName="ecos-base-tooltip-inner"*/}
                {/*  arrowClassName="ecos-base-tooltip-arrow"*/}
                {/*  target={id}*/}
                {/*>*/}
                {/*  {action.name}*/}
                {/*</UncontrolledTooltip>*/}
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
