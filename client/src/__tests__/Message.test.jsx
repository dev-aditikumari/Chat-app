import React from "react";
import { render, screen } from "@testing-library/react";
import Message from "../components/Message";

const message = { id: "m1", from: "a", to: "b", text: "see you at 5", createdAt: "2024-05-01T10:30:00.000Z" };

test("renders a sent message on the sent side", () => {
  render(<Message message={message} mine />);
  const row = screen.getByTestId("message");
  expect(row).toHaveClass("sent");
  expect(row).not.toHaveClass("received");
  expect(screen.getByText("see you at 5")).toBeInTheDocument();
});

test("renders a received message on the received side", () => {
  render(<Message message={message} mine={false} />);
  expect(screen.getByTestId("message")).toHaveClass("received");
});

test("renders text as text, not as HTML", () => {
  render(<Message message={{ ...message, text: "<b>bold</b>" }} mine />);
  expect(screen.getByText("<b>bold</b>")).toBeInTheDocument();
  expect(document.querySelector("b")).toBeNull();
});
