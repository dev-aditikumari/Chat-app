import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Register from "../pages/Register";
import api from "../utils/api";
import { registerRoute } from "../utils/APIRoutes";

jest.mock("../utils/api", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>chat home</div>} />
      </Routes>
    </MemoryRouter>
  );

function fill({ username = "alice", email = "alice@example.test", password = "password123", confirm = "password123" } = {}) {
  if (username) userEvent.type(screen.getByLabelText("Username"), username);
  if (email) userEvent.type(screen.getByLabelText("Email"), email);
  if (password) userEvent.type(screen.getByLabelText("Password"), password);
  if (confirm) userEvent.type(screen.getByLabelText("Confirm Password"), confirm);
  userEvent.click(screen.getByRole("button", { name: /create user/i }));
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test.each([
  [{ username: "ab" }, "Username should be at least 3 characters"],
  [{ email: "" }, "Email is required"],
  [{ password: "short", confirm: "short" }, "Password should be at least 8 characters"],
  [{ confirm: "different123" }, "Password and confirm password should be the same"],
])("validation %#: %j", async (input, message) => {
  renderRegister();
  fill(input);
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

test("sends username, email and password (not the confirmation) and stores the session", async () => {
  api.post.mockResolvedValue({ data: { status: true, user: { _id: "1", username: "alice" }, token: "tok" } });
  renderRegister();
  fill();
  expect(await screen.findByText("chat home")).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith(registerRoute, {
    username: "alice",
    email: "alice@example.test",
    password: "password123",
  });
  expect(localStorage.getItem("chat-app-token")).toBe("tok");
});

test("shows the server error, for example a duplicate username", async () => {
  api.post.mockRejectedValue({ response: { status: 409, data: { status: false, msg: "Username already used" } } });
  renderRegister();
  fill();
  expect(await screen.findByText("Username already used")).toBeInTheDocument();
  expect(screen.queryByText("chat home")).not.toBeInTheDocument();
});
