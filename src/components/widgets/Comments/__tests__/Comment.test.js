import React from 'react';
import { shallow, configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Comment from '../Comment';

configure({ adapter: new Adapter() });

console.error = jest.fn();

describe('Comment tests', () => {
  const baseProps = {
    id: 'comment-id@1',
    comment: {
      text: 'Comment',
      firstName: 'Admin',
      lastName: 'Administratorov',
      middleName: 'Adminovich'
    }
  };

  describe('<Comment />', () => {
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
  });

  describe('Testing props changes', () => {
    it('the text of the comment should change', () => {
      const component = mount(<Comment {...baseProps} />);
      let content = component.find('.ecos-comments__comment-text');

      expect(content.text()).toEqual('Comment');

      component.setProps({ ...baseProps, comment: { text: 'Another comment text' } });
      expect(content.text()).toEqual('Another comment text');
    });

    it('the information about the commentator should change', () => {
      const component = mount(<Comment {...baseProps} />);
      const content = component.find('.ecos-comments__comment-name');
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
      expect(content).toHaveLength(2);
      content.forEach((node, index) => {
        expect(node.text()).toEqual(nameParts[index]);
      });
    });

    it('It should be possible to delete a comment, because have rights', () => {
      const onDelete = jest.fn();
      const component = mount(
        <Comment
          {...baseProps}
          comment={{
            ...baseProps.comment,
            canDelete: true
          }}
          onDelete={onDelete}
        />
      );
      const btn = component.find('.ecos-comments__comment-btn-delete');

      expect(btn).toHaveLength(1);
      btn.simulate('click');
      expect(component.state().isOpenConfirmDialog).toEqual(true);
      component.update();
      expect(component.find('.ecos-comments__comment-confirm')).toHaveLength(1);

      const confirmBtn = component.find('.ecos-btn_red.ecos-comments__comment-confirm-btn .ecos-btn__content');

      expect(confirmBtn).not.toBeUndefined();
      confirmBtn.simulate('click');
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('It should be possible to edit a comment, because have rights', () => {
      const onEdit = jest.fn();
      const component = mount(
        <Comment
          {...baseProps}
          comment={{
            ...baseProps.comment,
            canEdit: true
          }}
          onEdit={onEdit}
        />
      );
      const btn = component.find('.ecos-comments__comment-btn.ecos-comments__comment-btn-edit');

      expect(btn).toHaveLength(1);
      btn.simulate('click');
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });
});
