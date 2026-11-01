import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import api from "../utils/api";
import { loginRoute } from "../utils/APIRoutes";

jest.mock("../utils/api", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>chat home</div>} />
        <Route path="/register" element={<div>register page</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test("shows a validation message when fields are empty and does not call the API", async () => {
  renderLogin();
  userEvent.click(screen.getByRole("button", { name: /log in/i }));
  expect(await screen.findByText("Username and password are required")).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

test("posts the credentials, stores the session and navigates home", async () => {
  api.post.mockResolvedValue({ data: { status: true, user: { _id: "1", username: "aditi_kumari" }, token: "tok" } });
  renderLogin();
  userEvent.type(screen.getByLabelText("Username"), "aditi_kumari");
  userEvent.type(screen.getByLabelText("Password"), "password123");
  userEvent.click(screen.getByRole("button", { name: /log in/i }));

  expect(await screen.findByText("chat home")).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith(loginRoute, { username: "aditi_kumari", password: "password123" });
  expect(localStorage.getItem("chat-app-token")).toBe("tok");
  expect(JSON.parse(localStorage.getItem("chat-app-user")).username).toBe("aditi_kumari");
});

test("shows the server error message and stays on the page", async () => {
  api.post.mockRejectedValue({ response: { status: 401, data: { status: false, msg: "Incorrect username or password" } } });
  renderLogin();
  userEvent.type(screen.getByLabelText("Username"), "aditi_kumari");
  userEvent.type(screen.getByLabelText("Password"), "wrongpass");
  userEvent.click(screen.getByRole("button", { name: /log in/i }));

  expect(await screen.findByText("Incorrect username or password")).toBeInTheDocument();
  expect(screen.queryByText("chat home")).not.toBeInTheDocument();
  expect(localStorage.getItem("chat-app-token")).toBeNull();
});

test("explains when the server cannot be reached", async () => {
  api.post.mockRejectedValue({ request: {} });
  renderLogin();
  userEvent.type(screen.getByLabelText("Username"), "aditi_kumari");
  userEvent.type(screen.getByLabelText("Password"), "password123");
  userEvent.click(screen.getByRole("button", { name: /log in/i }));
  expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument();
});

test("redirects to the chat when a session already exists", async () => {
  localStorage.setItem("chat-app-user", JSON.stringify({ _id: "1", username: "aditi_kumari" }));
  localStorage.setItem("chat-app-token", "tok");
  renderLogin();
  await waitFor(() => expect(screen.getByText("chat home")).toBeInTheDocument());
});
