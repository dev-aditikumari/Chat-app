import React from "react";
import { EventEmitter } from "events";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ChatContainer from "../components/ChatContainer";
import api from "../utils/api";

jest.mock("../utils/api", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
jest.mock("emoji-picker-react", () => ({ __esModule: true, default: () => null }));

const me = { _id: "me", username: "alice" };
const bob = { _id: "bob", username: "bob", avatarImage: "" };

function fakeSocket() {
  const emitter = new EventEmitter();
  return {
    on: (e, f) => emitter.on(e, f),
    off: (e, f) => emitter.off(e, f),
    emit: jest.fn(),
    receive: (message) => emitter.emit("msg-receive", message),
  };
}

const renderChat = (socket) =>
  render(
    <MemoryRouter>
      <ChatContainer currentChat={bob} currentUser={me} socket={socket} isOnline />
    </MemoryRouter>
  );

beforeEach(() => jest.clearAllMocks());

test("loads history and marks messages by direction", async () => {
  api.get.mockResolvedValue({
    data: {
      messages: [
        { id: "1", from: "me", to: "bob", text: "hi bob", createdAt: "2024-01-01T10:00:00Z" },
        { id: "2", from: "bob", to: "me", text: "hi alice", createdAt: "2024-01-01T10:01:00Z" },
      ],
    },
  });
  renderChat(fakeSocket());
  const rows = await screen.findAllByTestId("message");
  expect(rows[0]).toHaveClass("sent");
  expect(rows[1]).toHaveClass("received");
});

test("shows a live incoming message from the open chat and ignores other senders", async () => {
  api.get.mockResolvedValue({ data: { messages: [] } });
  const socket = fakeSocket();
  renderChat(socket);
  await screen.findByText(/no messages yet/i);
  act(() => socket.receive({ id: "9", from: "bob", to: "me", text: "live one", createdAt: new Date().toISOString() }));
  expect(await screen.findByText("live one")).toBeInTheDocument();
  act(() => socket.receive({ id: "10", from: "carol", to: "me", text: "wrong chat", createdAt: new Date().toISOString() }));
  expect(screen.queryByText("wrong chat")).not.toBeInTheDocument();
});

test("emits msg-send and shows the acknowledged message", async () => {
  api.get.mockResolvedValue({ data: { messages: [] } });
  const socket = fakeSocket();
  socket.emit.mockImplementation((event, payload, ack) =>
    ack({ status: true, message: { id: "5", from: "me", to: "bob", text: payload.message, createdAt: new Date().toISOString() } })
  );
  renderChat(socket);
  await screen.findByText(/no messages yet/i);
  userEvent.type(screen.getByLabelText("Message"), "outgoing{enter}");
  expect(socket.emit).toHaveBeenCalledWith("msg-send", { to: "bob", message: "outgoing" }, expect.any(Function));
  await waitFor(() => expect(screen.getByText("outgoing")).toBeInTheDocument());
  expect(screen.getByTestId("message")).toHaveClass("sent");
});
