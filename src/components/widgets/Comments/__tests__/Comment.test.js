import React from 'react';
import { shallow } from 'enzyme';

import { Comment } from '../Comment';

console.error = jest.fn();

const baseProps = {
  id: 'comment-id@1',
  comment: {
    text: 'Comment',
    firstName: 'Admin',
    lastName: 'Administratorov',
    middleName: 'Adminovich'
  }
};

const mutationObserverMock = jest.fn(function MutationObserver(callback) {
  this.observe = jest.fn();
  this.disconnect = jest.fn();
  // Optionally add a trigger() method to manually trigger a change
  this.trigger = mockedMutationsList => {
    callback(mockedMutationsList, this);
  };
});
global.MutationObserver = mutationObserverMock;
global.getSelection = () => '';

describe('Comment tests', () => {
  it('should render Comment component', () => {
    const component = shallow(<Comment {...baseProps} />);

    expect(component).toMatchSnapshot();
  });

  it('should render Comment component with opened delete confirm dialog', () => {
    const component = shallow(<Comment {...baseProps} />);

    component.setState({ isOpenConfirmDialog: true });

    expect(component).toMatchSnapshot();
  });

  it('should render Comment component with opened delete confirm dialog with loader', () => {
    const component = shallow(<Comment {...baseProps} />);

    component.setState({ isOpenConfirmDialog: true, isLoading: true });

    expect(component).toMatchSnapshot();
  });

  it('should render Comment component with opened delete confirm dialog without loader (because of a mistake)', () => {
    const component = shallow(<Comment {...baseProps} />);

    component.setState({ isOpenConfirmDialog: true, isLoading: true });
    component.setProps({ ...baseProps, actionFailed: true });

    expect(component).toMatchSnapshot();
  });

  it('should render Comment component with tags', () => {
    const component = shallow(
      <Comment
        {...baseProps}
        comment={{
          ...baseProps.comment,
          tags: [{ name: 'Tester' }, { type: 'task', name: '№1 (01.01.2021)' }, { type: 'action', name: '№22 (09.02.2021)' }]
        }}
      />
    );

    expect(component).toMatchSnapshot();
  });

  describe('Testing props changes', () => {
    it('the text of the comment should change', () => {
      const component = shallow(<Comment {...baseProps} />);
      const content1 = component.find('.ecos-comments__comment-editor');
      expect(content1.props().htmlString).toEqual('Comment');

      component.setProps({ ...baseProps, comment: { text: 'Another comment text' } });

      const content2 = component.find('.ecos-comments__comment-editor');
      expect(content2.props().htmlString).toEqual('Another comment text');
    });

    it('the information about the commentator should change', () => {
      const component = shallow(<Comment {...baseProps} />);
      let content = component.find('.ecos-comments__comment-name');
      let nameParts = ['Admin Adminovich', 'Administratorov'];

      expect(content).toHaveLength(2);
      content.forEach((node, index) => {
        expect(node.text()).toEqual(nameParts[index]);
      });

      component.setProps({
        ...baseProps,
        comment: {
          text: 'Comment',
          firstName: 'Admin',
          middleName: 'Adminovich'
        }
      });

      nameParts = ['Admin Adminovich', ''];
      content = component.find('.ecos-comments__comment-name');
      expect(content).toHaveLength(2);
      content.forEach((node, index) => {
        expect(node.text()).toEqual(nameParts[index]);
      });
    });

    it('It should be possible to delete a comment, because have rights', () => {
      const deleteComment = jest.fn();
      const component = shallow(
        <Comment
          {...baseProps}
          comment={{
            ...baseProps.comment,
            canDelete: true
          }}
          deleteComment={deleteComment}
        />
      );
      const btn = component.find('.ecos-comments__comment-btn-delete');

      expect(btn).toHaveLength(1);
      btn.simulate('click');
      expect(component.state().isOpenConfirmDialog).toEqual(true);
      component.update();
      expect(component.find('.ecos-comments__comment-confirm')).toHaveLength(1);

      const confirmBtn = component.find('.ecos-btn_red.ecos-comments__comment-confirm-btn');

      expect(confirmBtn).not.toBeUndefined();
      confirmBtn.simulate('click');
      expect(deleteComment).toHaveBeenCalledTimes(1);
    });
  });
});
