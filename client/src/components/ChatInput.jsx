import React, { useState } from "react";
import styled from "styled-components";
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import { BsEmojiSmileFill } from "react-icons/bs";

const ChatInput = ({ handleSendMsg }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [msg, setMsg] = useState("");

  const handleEmojiClick = (emojiData) => {
    setMsg((current) => current + emojiData.emoji);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.trim().length > 0) {
      handleSendMsg(msg);
      setMsg("");
    }
  };

  return (
    <Container>
      <div className="button-container">
        <div className="emoji">
          <button
            type="button"
            className="emoji-toggle"
            aria-label="Toggle emoji picker"
            onClick={() => setShowEmojiPicker((v) => !v)}
          >
            <BsEmojiSmileFill />
          </button>
          {showEmojiPicker && (
            <div className="picker">
              <Picker onEmojiClick={handleEmojiClick} theme="dark" height={350} />
            </div>
          )}
        </div>
      </div>
      <form className="input-container" onSubmit={sendChat}>
        <input
          type="text"
          placeholder="Type your message here"
          aria-label="Message"
          maxLength={2000}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button className="submit" type="submit" aria-label="Send">
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 5% 95%;
  align-items: center;
  background-color: #080420;
  padding: 0 2rem;
  padding-bottom: 0.3rem;
  .button-container {
    display: flex;
    align-items: center;
    color: white;
    gap: 1rem;
    .emoji {
      position: relative;
      .emoji-toggle {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
      }
      svg {
        font-size: 1.5rem;
        color: #ffff00c8;
      }
      .picker {
        position: absolute;
        bottom: 3rem;
        z-index: 10;
        box-shadow: 0 5px 10px #9a86f3;
      }
    }
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    background-color: #ffffff34;
    input {
      width: 90%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 1.2rem;
      &::selection {
        background-color: #9186f3;
      }
      &:focus {
        outline: none;
      }
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9a86f3;
      border: none;
      cursor: pointer;
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;

export default ChatInput;
