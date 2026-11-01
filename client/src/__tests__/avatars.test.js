import axios from "axios";
import { initialsSvg, localAvatars, remoteAvatars } from "../utils/avatars";

test("initials avatar uses the first letter, uppercased", () => {
  expect(initialsSvg("bob", "#fff")).toContain(">B</text>");
  expect(initialsSvg("", "#fff")).toContain(">?</text>");
});

test("local avatars are distinct base64 SVGs", () => {
  const list = localAvatars("alice", 4, 0);
  expect(list).toHaveLength(4);
  expect(new Set(list).size).toBe(4);
  expect(atob(list[0])).toMatch(/^<svg/);
});

test("remote avatars reject when the service is unreachable so the caller can fall back", async () => {
  jest.spyOn(axios, "get").mockRejectedValue(new Error("Network Error"));
  await expect(remoteAvatars("https://avatars.invalid")).rejects.toThrow("Network Error");
});
