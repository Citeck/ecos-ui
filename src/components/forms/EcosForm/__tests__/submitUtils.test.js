import { AWAITED_SUBMIT, handleSubmitResult, isAwaitedSubmit, isThenable } from '../submitUtils';

describe('submitUtils', () => {
  describe('isThenable', () => {
    it.each([[undefined], [null], [0], [''], [{}], [{ then: 'not a function' }], [[]]])('should be false for %p', value => {
      expect(isThenable(value)).toBe(false);
    });

    it.each([[Promise.resolve()], [{ then: () => {} }]])('should be true for %p', value => {
      expect(isThenable(value)).toBe(true);
    });
  });

  describe('isAwaitedSubmit', () => {
    it('should recognize the marker EcosForm passes to an awaited onSubmit', () => {
      expect(isAwaitedSubmit(AWAITED_SUBMIT)).toBe(true);
    });

    it('should be false for the arguments of a non awaited onSubmit', () => {
      expect(isAwaitedSubmit(undefined)).toBe(false);
      expect(isAwaitedSubmit(null)).toBe(false);
      expect(isAwaitedSubmit({})).toBe(false);
    });

    it('should not accept a look-alike object built elsewhere', () => {
      expect(isAwaitedSubmit({ ...AWAITED_SUBMIT })).toBe(false);
    });
  });

  describe('handleSubmitResult', () => {
    it('should run handlers synchronously and return the result as is for a non-thenable', () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const onSettled = jest.fn();

      const returned = handleSubmitResult(undefined, { onSuccess, onError, onSettled });

      expect(returned).toBeUndefined();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onSuccess and onSettled only after a resolved promise', async () => {
      let resolveSubmit;
      const onSuccess = jest.fn();
      const onSettled = jest.fn();

      const returned = handleSubmitResult(new Promise(resolve => (resolveSubmit = resolve)), { onSuccess, onSettled });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();

      resolveSubmit('done');
      await expect(returned).resolves.toBe('done');

      expect(onSuccess).toHaveBeenCalledWith('done');
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('should call onError and onSettled on a rejected promise', async () => {
      const error = new Error('Mutation failed');
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const onSettled = jest.fn();

      await handleSubmitResult(Promise.reject(error), { onSuccess, onError, onSettled });

      expect(onError).toHaveBeenCalledWith(error);
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should rethrow a rejection when onError is not provided', async () => {
      const error = new Error('Mutation failed');
      const onSettled = jest.fn();

      await expect(handleSubmitResult(Promise.reject(error), { onSettled })).rejects.toBe(error);

      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('should support a foreign thenable without catch/finally of its own', async () => {
      const onSuccess = jest.fn();
      const onSettled = jest.fn();
      const thenable = { then: onFulfilled => onFulfilled('done') };

      await handleSubmitResult(thenable, { onSuccess, onSettled });

      expect(onSuccess).toHaveBeenCalledWith('done');
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    describe('onSettled is finally-like, as in the branch where the form saves the record itself', () => {
      it('should report a throwing onSuccess through onError and still settle', async () => {
        const error = new Error('Side effect failed');
        const onError = jest.fn();
        const onSettled = jest.fn();

        await handleSubmitResult(Promise.resolve(), {
          onSuccess: () => {
            throw error;
          },
          onError,
          onSettled
        });

        expect(onError).toHaveBeenCalledWith(error);
        expect(onSettled).toHaveBeenCalledTimes(1);
      });

      it('should settle when onError throws', async () => {
        const onSettled = jest.fn();

        await expect(
          handleSubmitResult(Promise.reject(new Error('Mutation failed')), {
            onError: () => {
              throw new Error('Error reporting failed');
            },
            onSettled
          })
        ).rejects.toThrow('Error reporting failed');

        expect(onSettled).toHaveBeenCalledTimes(1);
      });

      it('should settle when a synchronous onSuccess throws', () => {
        const onSettled = jest.fn();

        expect(() =>
          handleSubmitResult(undefined, {
            onSuccess: () => {
              throw new Error('Side effect failed');
            },
            onSettled
          })
        ).toThrow('Side effect failed');

        expect(onSettled).toHaveBeenCalledTimes(1);
      });
    });
  });
});
