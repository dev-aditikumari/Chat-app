import React from "react";
import styled from "styled-components";

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Message = ({ message, mine }) => (
  <Row className={mine ? "sent" : "received"} data-testid="message">
    <div className="content">
      <p>{message.text}</p>
      <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
    </div>
  </Row>
);

const Row = styled.div`
  display: flex;
  align-items: center;
  .content {
    max-width: 40%;
    overflow-wrap: anywhere;
    padding: 0.8rem 1rem;
    font-size: 1.05rem;
    border-radius: 1rem;
    color: #d1d1d1;
    p {
      white-space: pre-wrap;
    }
    time {
      display: block;
      margin-top: 0.3rem;
      font-size: 0.7rem;
      opacity: 0.7;
    }
  }
  &.sent {
    justify-content: flex-end;
    .content {
      background-color: #4f04ff21;
    }
  }
  &.received {
    justify-content: flex-start;
    .content {
      background-color: #9900ff20;
    }
  }
`;

export default Message;
