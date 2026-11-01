import React from 'react'
import styled from "styled-components"
import Logout from './Logout'
import ChatInput from './ChatInput'
import Message from './Message'

const ChatContainer = ({currentChat}) => {
    const handleSendMsg = async (msg)=>{

    }
  return (<>{
    currentChat && (
    <Container>
        <div className="chat-header">
            <div className="user-details">
                <div className="avatar">

                </div>
                <div className="username">
                    <h3>{currentChat.username}</h3>
                </div>
            </div>
            <Logout/>
        </div>
       <Message/>
        <ChatInput handleSendMsg={handleSendMsg}/>
    </Container>)}
    </>

  )
}

export default ChatContainer
const Container = styled.div`
    padding-top:1rem;
    .chat-header{
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 2rem;
        .user-details{
            display: flex;
            gap: 1rem;
            align-items:center;
            .avatar{
               img {
                height: 3rem;
               }
            }
            .username{
                h3{
                    color: white;

                }
            }
        }
    }
`