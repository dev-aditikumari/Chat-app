import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SetAvatar from "../pages/SetAvatar";
import api from "../utils/api";
import { setAvatarRoute } from "../utils/APIRoutes";

jest.mock("../utils/api", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("chat-app-user", JSON.stringify({ _id: "1", username: "aditi_kumari" }));
  localStorage.setItem("chat-app-token", "tok");
  jest.clearAllMocks();
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/setAvatar"]}>
      <Routes>
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/" element={<div>chat home</div>} />
      </Routes>
    </MemoryRouter>
  );

test("offers locally generated avatars without any network and saves the chosen one", async () => {
  api.post.mockResolvedValue({ data: { status: true, isSet: true, image: "IMG" } });
  renderPage();
  const options = await screen.findAllByRole("button", { name: /^Avatar \d/ });
  expect(options).toHaveLength(4);
  userEvent.click(options[1]);
  userEvent.click(screen.getByRole("button", { name: /set as profile picture/i }));
  expect(await screen.findByText("chat home")).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith(setAvatarRoute, { image: expect.stringMatching(/^[A-Za-z0-9+/=]+$/) });
  expect(JSON.parse(localStorage.getItem("chat-app-user"))).toMatchObject({ isAvatarImageSet: true, avatarImage: "IMG" });
});

test("asks for a selection before saving", async () => {
  renderPage();
  await screen.findAllByRole("button", { name: /^Avatar \d/ });
  userEvent.click(screen.getByRole("button", { name: /set as profile picture/i }));
  expect(await screen.findByText("Please select an avatar")).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
