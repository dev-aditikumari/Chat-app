import "@testing-library/jest-dom";

// React Testing Library 13 still calls the old act export, which React 18.3 warns about.
const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args) => {
    if (typeof args[0] === "string" && args[0].includes("ReactDOMTestUtils.act")) return;
    originalError(...args);
  });
});
