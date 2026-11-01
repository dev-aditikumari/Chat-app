import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "../components/ChatInput";

jest.mock("emoji-picker-react", () => ({
  __esModule: true,
  default: ({ onEmojiClick }) => (
    <div data-testid="picker">
      <button type="button" onClick={() => onEmojiClick({ emoji: "😀" })}>
        pick-smile
      </button>
    </div>
  ),
}));

test("sends the typed message and clears the field", () => {
  const onSend = jest.fn();
  render(<ChatInput handleSendMsg={onSend} />);
  const input = screen.getByLabelText("Message");
  userEvent.type(input, "hello there");
  userEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(onSend).toHaveBeenCalledWith("hello there");
  expect(input).toHaveValue("");
});

test("sends on Enter", () => {
  const onSend = jest.fn();
  render(<ChatInput handleSendMsg={onSend} />);
  userEvent.type(screen.getByLabelText("Message"), "via enter{enter}");
  expect(onSend).toHaveBeenCalledWith("via enter");
});

test("does not send empty or whitespace-only messages", () => {
  const onSend = jest.fn();
  render(<ChatInput handleSendMsg={onSend} />);
  userEvent.click(screen.getByRole("button", { name: "Send" }));
  userEvent.type(screen.getByLabelText("Message"), "   ");
  userEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(onSend).not.toHaveBeenCalled();
});

test("toggles the emoji picker and appends the chosen emoji", () => {
  render(<ChatInput handleSendMsg={jest.fn()} />);
  expect(screen.queryByTestId("picker")).not.toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: /toggle emoji picker/i }));
  expect(screen.getByTestId("picker")).toBeInTheDocument();
  userEvent.type(screen.getByLabelText("Message"), "hi ");
  userEvent.click(screen.getByText("pick-smile"));
  expect(screen.getByLabelText("Message")).toHaveValue("hi 😀");
  userEvent.click(screen.getByRole("button", { name: /toggle emoji picker/i }));
  expect(screen.queryByTestId("picker")).not.toBeInTheDocument();
});
