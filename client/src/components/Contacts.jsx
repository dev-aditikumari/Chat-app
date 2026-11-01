import React, { useState } from "react";
import styled from "styled-components";
import logo from "../assets/logo.svg";
import { avatarSrc } from "../utils/avatars";

const Contacts = ({ contacts, currentUser, changeChat, onlineIds = [], unread = {} }) => {
  const [currentSelected, setCurrentSelected] = useState(undefined);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  if (!currentUser?.avatarImage) return null;

  return (
    <Container>
      <div className="brand">
        <img src={logo} alt="logo" />
        <h3>Let's Talk</h3>
      </div>
      <div className="contacts">
        {contacts.length === 0 && <p className="empty">No other users yet. Register a second account to chat.</p>}
        {contacts.map((contact, index) => (
          <div
            className={`contact ${index === currentSelected ? "selected" : ""}`}
            key={contact._id}
            role="button"
            tabIndex={0}
            onClick={() => changeCurrentChat(index, contact)}
            onKeyDown={(e) => e.key === "Enter" && changeCurrentChat(index, contact)}
          >
            <div className="avatar">
              {contact.avatarImage ? (
                <img src={avatarSrc(contact.avatarImage)} alt="" />
              ) : (
                <div className="placeholder">{contact.username[0].toUpperCase()}</div>
              )}
            </div>
            <div className="username">
              <h3>{contact.username}</h3>
            </div>
            {onlineIds.includes(contact._id) && <span className="online" title="Online" aria-label="online" />}
            {unread[contact._id] > 0 && <span className="badge">{unread[contact._id]}</span>}
          </div>
        ))}
      </div>
      <div className="current-user">
        <div className="avatar">
          <img src={avatarSrc(currentUser.avatarImage)} alt="" />
        </div>
        <div className="username">
          <h2>{currentUser.username}</h2>
        </div>
      </div>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    align-items: center;
    justify-content: center;
    gap: 1rem;
    display: flex;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #ffffff39;
      border-radius: 1rem;
    }
    .empty {
      color: #ffffffaa;
      padding: 1rem;
      text-align: center;
    }
    .contact {
      background-color: #ffffff39;
      min-height: 5rem;
      width: 90%;
      cursor: pointer;
      border-radius: 0.2rem;
      padding: 0.4rem;
      gap: 1rem;
      align-items: center;
      display: flex;
      transition: 0.5s ease-in-out;
      .avatar img,
      .placeholder {
        height: 3rem;
        width: 3rem;
        border-radius: 50%;
      }
      .placeholder {
        background: #4e0eff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      .username h3 {
        color: white;
      }
      .online {
        margin-left: auto;
        height: 0.7rem;
        width: 0.7rem;
        border-radius: 50%;
        background: #37d67a;
      }
      .badge {
        background: #e03131;
        color: white;
        border-radius: 1rem;
        padding: 0.1rem 0.5rem;
        font-size: 0.8rem;
      }
    }
    .selected {
      background-color: #9186f3;
    }
  }
  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar img {
      height: 4rem;
      width: 4rem;
      border-radius: 50%;
    }
    .username h2 {
      color: white;
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username h2 {
        font-size: 1rem;
      }
    }
  }
`;

export default Contacts;
