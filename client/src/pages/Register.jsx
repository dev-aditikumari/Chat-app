import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormContainer from "../components/FormContainer";
import logo from "../assets/logo.svg";
import api from "../utils/api";
import { errorMessage } from "../utils/errors";
import { registerRoute } from "../utils/APIRoutes";
import { getSession, saveSession } from "../utils/session";
import { toastOptions } from "../utils/toast";

const Register = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getSession()) navigate("/");
  }, [navigate]);

  const handleValidation = () => {
    const { password, confirmPassword, username, email } = values;
    if (username.trim().length < 3) {
      toast.error("Username should be at least 3 characters", toastOptions);
      return false;
    }
    if (email.trim() === "") {
      toast.error("Email is required", toastOptions);
      return false;
    }
    if (password.length < 8) {
      toast.error("Password should be at least 8 characters", toastOptions);
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirm password should be the same", toastOptions);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!handleValidation()) return;
    setSubmitting(true);
    try {
      const { username, email, password } = values;
      const { data } = await api.post(registerRoute, {
        username: username.trim(),
        email: email.trim(),
        password,
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
          <input type="text" placeholder="Username" name="username" aria-label="Username" autoComplete="username" value={values.username} onChange={handleChange} />
          <input type="email" placeholder="Email" name="email" aria-label="Email" autoComplete="email" value={values.email} onChange={handleChange} />
          <input type="password" placeholder="Password" name="password" aria-label="Password" autoComplete="new-password" value={values.password} onChange={handleChange} />
          <input type="password" placeholder="Confirm Password" name="confirmPassword" aria-label="Confirm Password" autoComplete="new-password" value={values.confirmPassword} onChange={handleChange} />
          <button type="submit" disabled={submitting}>
            Create User
          </button>
          <span>
            Already have an account? <Link to="/login">Login</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
};

export default Register;
