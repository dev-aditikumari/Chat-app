import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import { errorMessage } from "../utils/errors";
import { setAvatarRoute } from "../utils/APIRoutes";
import { avatarSrc, localAvatars, remoteAvatars } from "../utils/avatars";
import { getSession, saveSession } from "../utils/session";
import { toastOptions } from "../utils/toast";

const REMOTE_AVATAR_API = process.env.REACT_APP_AVATAR_API;

const SetAvatar = () => {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      let images;
      if (REMOTE_AVATAR_API) {
        try {
          images = await remoteAvatars(REMOTE_AVATAR_API);
        } catch {
          toast.warn("Could not reach the avatar service. Using locally generated avatars instead.", toastOptions);
        }
      }
      if (!images) images = localAvatars(session.user.username);
      if (!cancelled) {
        setAvatars(images);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const setProfilePicture = async () => {
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar", toastOptions);
      return;
    }
    try {
      const { data } = await api.post(setAvatarRoute, { image: avatars[selectedAvatar] });
      if (data.isSet) {
        const { user, token } = getSession();
        saveSession({ ...user, isAvatarImageSet: true, avatarImage: data.image }, token);
        navigate("/");
      } else {
        toast.error("Error setting avatar. Please try again", toastOptions);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Error setting avatar. Please try again"), toastOptions);
    }
  };

  return (
    <>
      <Container>
        {isLoading ? (
          <h2 className="loading">Preparing avatars...</h2>
        ) : (
          <>
            <div className="title-container">
              <h1>Pick an avatar as your profile picture</h1>
            </div>
            <div className="avatars">
              {avatars.map((avatar, index) => (
                <button
                  type="button"
                  key={index}
                  aria-label={`Avatar ${index + 1}`}
                  aria-pressed={selectedAvatar === index}
                  className={`avatar ${selectedAvatar === index ? "selected" : ""}`}
                  onClick={() => setSelectedAvatar(index)}
                >
                  <img src={avatarSrc(avatar)} alt="" />
                </button>
              ))}
            </div>
            <button className="submit-btn" onClick={setProfilePicture}>
              Set as Profile Picture
            </button>
          </>
        )}
      </Container>
      <ToastContainer />
    </>
  );
};

export default SetAvatar;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 3rem;
  background-color: #131324;
  height: 100vh;
  width: 100vw;
  .loading,
  h1 {
    color: white;
    text-align: center;
  }
  .avatars {
    display: flex;
    gap: 2rem;
    .avatar {
      border: 0.4rem solid transparent;
      background: none;
      padding: 0.4rem;
      border-radius: 5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: 0.5s ease-in-out;
      img {
        height: 6rem;
        width: 6rem;
        border-radius: 50%;
      }
    }
    .selected {
      border: 0.4rem solid #4e0eff;
    }
  }
  .submit-btn {
    background-color: #997af0;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    transition: 0.5s ease-in-out;
    &:hover {
      background-color: #4e0eff;
    }
  }
`;
