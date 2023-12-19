import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import ApiConnector from "../../../api/apiConnector";
import ApiEndpoints from "../../../api/apiEndpoints";
import AppPaths from "../../../lib/appPaths";
import CookieUtil from "../../../util/cookieUtil";
import Constants from "../../../lib/constants";
import "../authStyle.css";

const LoginScreen = ({ location }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (loginData) => {
    const successLoginData = await ApiConnector.sendPostRequest(
      ApiEndpoints.LOGIN_URL,
      JSON.stringify({email: loginData.username, password: loginData.password}),
      false,
      false
    );
    CookieUtil.setCookie(Constants.ACCESS_PROPERTY, successLoginData.token);
    const userInfo = await ApiConnector.sendGetRequest(ApiEndpoints.USER_URL);
    localStorage.setItem("user_id", userInfo.data.UserID);
    // if (successLoginData) {
    //   Object.keys(successLoginData).forEach((key) => {
    //     CookieUtil.setCookie(key, successLoginData[key]);
    //   });
    //   console.log(CookieUtil)
      window.location.href = AppPaths.HOME;
    // }
  };

  const getLoginMessage = () => {
    if (
      location &&
      location.state &&
      location.state.redirectFrom === AppPaths.SIGN_UP
    ) {
      return (
        <div id="loginMessage">
          Your account has been created successfully. Please login.
        </div>
      );
    }
    return null;
  };

  return (
    <div id="authFormContainer">
      <div id="authForm">
        {getLoginMessage()}
        <h2 id="authTitle">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="authFieldContainer">
            <input
              className="authField"
              type="email"
              placeholder="Email"
              {...register("username", { required: true })}
            />
            {errors.username && (
              <p className="requiredFieldError">This field is required</p>
            )}
          </div>
          <div className="authFieldContainer">
            <input
              className="authField"
              type="password"
              placeholder="Password"
              {...register("password", { required: true })}
            />
            {errors.password && (
              <p className="requiredFieldError">This field is required</p>
            )}
          </div>
          <br />
          <button className="btn btn-outline-warning btn-block" type="submit">
            Login
          </button>
        </form>
        <p id="authFormFooter">
          Don't have any account! <Link to="/signup">Click here</Link> to
          singup.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
