import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logout from "./Logout";
import ChatInput from "./ChatInput";
import Message from "./Message";
import api from "../utils/api";
import { errorMessage } from "../utils/errors";
import { getMessagesRoute } from "../utils/APIRoutes";
import { avatarSrc } from "../utils/avatars";
import { toastOptions } from "../utils/toast";

const ChatContainer = ({ currentChat, currentUser, socket, isOnline }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`${getMessagesRoute}/${currentChat._id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages((prev) => {
          const known = new Set(data.messages.map((m) => m.id));
          return [...data.messages, ...prev.filter((m) => !known.has(m.id))];
        });
      })
      .catch((err) => toast.error(errorMessage(err, "Could not load messages"), toastOptions))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentChat._id]);

  useEffect(() => {
    if (!socket) return undefined;
    const onReceive = (message) => {
      if (message.from !== currentChat._id) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on("msg-receive", onReceive);
    return () => socket.off("msg-receive", onReceive);
  }, [socket, currentChat._id]);

  useEffect(() => {
    if (endRef.current?.scrollIntoView) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMsg = (text) => {
    if (!socket) {
      toast.error("Not connected to the server yet", toastOptions);
      return;
    }
    socket.emit("msg-send", { to: currentChat._id, message: text }, (res) => {
      if (res?.status && res.message) {
        setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]));
      } else {
        toast.error(res?.msg || "Message could not be sent", toastOptions);
      }
    });
  };

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            {currentChat.avatarImage && <img src={avatarSrc(currentChat.avatarImage)} alt="" />}
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            <small>{isOnline ? "online" : "offline"}</small>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages" aria-live="polite">
        {!loading && messages.length === 0 && <p className="empty">No messages yet. Say hello.</p>}
        {messages.map((m) => (
          <Message key={m.id} message={m} mine={m.from === currentUser._id} />
        ))}
        <div ref={endRef} />
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
      <ToastContainer />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 78% 12%;
  gap: 0.1rem;
  overflow: hidden;
  padding-top: 1rem;
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      gap: 1rem;
      align-items: center;
      .avatar img {
        height: 3rem;
        width: 3rem;
        border-radius: 50%;
      }
      .username {
        h3 {
          color: white;
        }
        small {
          color: #ffffffaa;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ffffff39;
      border-radius: 1rem;
    }
    .empty {
      color: #ffffffaa;
      text-align: center;
      margin-top: 2rem;
    }
  }
`;

export default ChatContainer;
