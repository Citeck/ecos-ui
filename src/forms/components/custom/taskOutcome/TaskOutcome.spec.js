import Formio from '../../../Formio';
import '../../../Webform'; // ecos overrides of the form itself
import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import TaskOutcomeComponent from './TaskOutcome';
import comp1 from './fixtures/comp1';

import { t } from '@/helpers/util';

basicSectionTest(TaskOutcomeComponent);

describe('TaskOutcome Component', () => {
  it('Should build a TaskOutcome component', done => {
    Harness.testCreate(TaskOutcomeComponent, comp1).then(() => {
      done();
    });
  });

  describe('comment required', () => {
    const formJson = {
      type: 'form',
      components: [{ label: 'Comment', type: 'textarea', input: true, key: 'comment' }, comp1]
    };
    // The outcomes come from the task record; a form without `recordId` loads none, so they are set here.
    const BUTTONS = [
      { key: 'Approve', label: 'Approve', theme: 'success', commentRequired: false },
      { key: 'Reject', label: 'Reject', theme: 'danger', commentRequired: true }
    ];
    const commentRequired = () => t('task-outcome.comment-required');

    const createForm = async () => {
      const form = await Formio.createForm(document.createElement('div'), formJson);
      const outcome = form.getComponent('taskOutcome');

      outcome.component.buttons = BUTTONS;

      return { form, outcome, comment: form.getComponent('comment') };
    };
    const formAlert = form => form.element.querySelector('div.alert.alert-danger[role="alert"]');

    // What a click on a verdict leaves in the form data (the other verdicts are cleared by the button itself).
    const press = (outcome, key) => {
      BUTTONS.forEach(button => {
        outcome.data[`outcome_${button.key}`] = button.key === key ? true : undefined;
      });

      return outcome.beforeSubmit();
    };

    it('should stop a verdict that needs a comment and mark the empty comment', async () => {
      const { outcome, comment } = await createForm();

      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());
      expect(comment.error.message).toBe(commentRequired());
      expect(outcome.data.outcome_Reject).toBeUndefined();
    });

    it('should take the error off the comment when the next click is a verdict that does not need one', async () => {
      const { outcome, comment } = await createForm();

      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());
      await press(outcome, 'Approve');

      expect(comment.error).toBeNull();
      expect(comment.element.classList.contains('has-error')).toBe(false);
      expect(outcome.data.outcome_Approve).toBe(true);
    });

    it('should keep the error when the next click again needs a comment', async () => {
      const { outcome, comment } = await createForm();

      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());
      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());

      expect(comment.error.message).toBe(commentRequired());
    });

    it('should leave alone any other error of the comment field', async () => {
      const { outcome, comment } = await createForm();

      comment.setCustomValidity('Comment is too long', true);
      await press(outcome, 'Approve');

      expect(comment.error.message).toBe('Comment is too long');
    });

    it('should take down the alert a previous attempt left when stopping for a comment', async () => {
      const { form, outcome } = await createForm();

      // what a verdict the server rejected leaves above the form
      form.showErrors(new Error('Required fields are not filled: Planned payment date'), true);
      expect(formAlert(form)).not.toBeNull();

      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());

      expect(formAlert(form)).toBeNull();
    });

    it('should leave the alert in place when the verdict goes on to submit', async () => {
      const { form, outcome } = await createForm();

      form.showErrors(new Error('Required fields are not filled: Planned payment date'), true);
      await press(outcome, 'Approve');

      expect(formAlert(form)).not.toBeNull();
    });

    it('should let a verdict that needs a comment through once the comment is filled', async () => {
      const { outcome, comment } = await createForm();

      await expect(press(outcome, 'Reject')).rejects.toThrow(commentRequired());
      comment.setValue('Documents are incomplete');
      await press(outcome, 'Reject');

      expect(comment.error).toBeNull();
      expect(outcome.data.outcome_Reject).toBe(true);
    });
  });
});
