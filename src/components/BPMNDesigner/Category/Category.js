import React from 'react';
import { Collapse } from 'reactstrap';
import cn from 'classnames';
import styles from './Category.module.scss';

class Category extends React.Component {
  state = {
    isCollapsed: false
  };

  toggleCollapse = () => {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  };

  render() {
    const { label, level } = this.props;

    return (
      <div
        className={cn(styles.category, {
          [styles.categoryLevel1]: level === 1,
          [styles.categoryLevel2]: level === 2
        })}
      >
        <h3
          onClick={this.toggleCollapse}
          className={cn(styles.label, {
            [styles.labelForCollapsed]: this.state.isCollapsed
          })}
        >
          {label}
        </h3>
        <Collapse isOpen={this.state.isCollapsed}>
          <div className={styles.content}>{this.props.children}</div>
        </Collapse>
      </div>
    );
  }
}

export default Category;
