import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormContainer from "../components/FormContainer";
import logo from "../assets/logo.svg";
import api from "../utils/api";
import { errorMessage } from "../utils/errors";
import { loginRoute } from "../utils/APIRoutes";
import { getSession, saveSession } from "../utils/session";
import { toastOptions } from "../utils/toast";

const Login = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getSession()) navigate("/");
  }, [navigate]);

  const handleValidation = () => {
    if (values.username.trim() === "" || values.password === "") {
      toast.error("Username and password are required", toastOptions);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!handleValidation()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(loginRoute, {
        username: values.username.trim(),
        password: values.password,
      });
      saveSession(data.user, data.token);
      navigate("/");
    } catch (err) {
      toast.error(errorMessage(err), toastOptions);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  return (
    <>
      <FormContainer>
        <form onSubmit={handleSubmit} noValidate>
          <div className="brand">
            <img src={logo} alt="Logo" />
            <h1>Let's Talk</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            aria-label="Username"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            aria-label="Password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
          />
          <button type="submit" disabled={submitting}>
            Log In
          </button>
          <span>
            Don't have an account? <Link to="/register">Register</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
};

export default Login;
