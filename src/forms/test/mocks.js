// import sinon from 'sinon';

global.document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document
  }
});

global.require = () => {};

// const createElement = global.document.createElement;
// const FAKECanvasElement = {
//   getContext: jest.fn(() => {
//     return {
//       fillStyle: null,
//       fillRect: jest.fn(),
//       drawImage: jest.fn(),
//       getImageData: jest.fn(),
//     };
//   }),
//   setAttribute: jest.fn(),
// };
//
// /**
//  * Using Sinon to stub the createElement function call with the original method
//  * unless we match the 'canvas' argument.  If that the case, return the Fake
//  * Canvas object.
//  */
// sinon
//   .stub(global.document, 'createElement')
//   .callsFake(createElement)
//   .withArgs('canvas')
//   .returns(FAKECanvasElement);
