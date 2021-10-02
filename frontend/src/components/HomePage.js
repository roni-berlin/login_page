import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import { useCookies } from "react-cookie";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import api from "../api";
const HomePage = (props) => {
  const [cookies, removeCookie] = useCookies([
    "accessToken",
    "refreshToken",
    "_id",
  ]);
  const [user, setUser] = useState();
  const history = useHistory();
  const getUser = async () => {
    if (props.location.user) {
      setUser(props.location.user);
    } else {
      let accessToken = await cookies.accessToken;
      const connectedUser = await api.validate(accessToken);
      if (connectedUser) {
        setUser(connectedUser);
      } else {
        const jwt = await api.refreshToken({
          _id: cookies._id,
          refreshToken: cookies.refreshToken,
        });
        const connectedUser = await api.validate(jwt);
        if (connectedUser) {
          setUser(connectedUser);
        } else {
          history.push({ pathname: "/login" });
        }
      }
    }
  };
  useEffect(() => {
    getUser();
  }, []);

  const logOut = () => {
    removeCookie("accessToken");
    removeCookie("refreshToken");
    removeCookie("_id");
    history.push({ pathname: "/login" });
  };
  if (!user) {
    return (
      <div className="d-flex justify-content-md-center align-items-center vh-100">
        <Loader type="Puff" color="gray" height={300} width={300} />
      </div>
    );
  }
  return (
    <div>
      <h1 className="d-flex justify-content-md-center align-items-center my-5 display-1">
        Hello {user?.firstName} {user?.lastName}
      </h1>
      <div className="d-flex justify-content-center">
        <button className="btn btn-secondary" onClick={logOut}>
          log out
        </button>
      </div>
    </div>
  );
};

export default HomePage;
