import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../utils/api";
import { allUserRoute, host } from "../utils/APIRoutes";
import { clearSession, getSession } from "../utils/session";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import ChatContainer from "../components/ChatContainer";

const Chat = () => {
  const navigate = useNavigate();
  const [session] = useState(getSession);
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);
  const [unread, setUnread] = useState({});
  const currentChatRef = useRef(undefined);
  currentChatRef.current = currentChat;

  const currentUser = session?.user;

  useEffect(() => {
    if (!session) navigate("/login");
    else if (!currentUser.isAvatarImageSet) navigate("/setAvatar");
  }, [session, currentUser, navigate]);

  useEffect(() => {
    if (!session || !currentUser.isAvatarImageSet) return undefined;
    let cancelled = false;
    api
      .get(allUserRoute)
      .then(({ data }) => {
        if (!cancelled) setContacts(data);
      })
      .catch(() => {});

    const s = io(host, { auth: { token: session.token } });
    s.on("online-users", setOnlineIds);
    s.on("msg-receive", (message) => {
      if (currentChatRef.current?._id !== message.from) {
        setUnread((prev) => ({ ...prev, [message.from]: (prev[message.from] || 0) + 1 }));
      }
    });
    s.on("connect_error", (err) => {
      if (err.message === "Authentication required") {
        clearSession();
        navigate("/login");
      }
    });
    setSocket(s);
    return () => {
      cancelled = true;
      s.disconnect();
    };
  }, [session, currentUser, navigate]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setUnread((prev) => ({ ...prev, [chat._id]: 0 }));
  };

  if (!session) return null;

  return (
    <Container>
      <div className="container">
        <Contacts
          contacts={contacts}
          currentUser={currentUser}
          changeChat={handleChatChange}
          onlineIds={onlineIds}
          unread={unread}
        />
        {currentChat === undefined ? (
          <Welcome currentUser={currentUser} />
        ) : (
          <ChatContainer
            key={currentChat._id}
            currentChat={currentChat}
            currentUser={currentUser}
            socket={socket}
            isOnline={onlineIds.includes(currentChat._id)}
          />
        )}
      </div>
    </Container>
  );
};

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    overflow: hidden;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;

export default Chat;
