require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const url = `${process.env.REACT_APP_SERVER_HOST}:${process.env.REACT_APP_SERVER_PORT}`;
const Swal = require("sweetalert2");

module.exports = {
  login(data) {
    return axios
      .post(
        `${url}/sign-in`,
        { data },
        { withCredentials: true, credentials: "include" }
      )
      .then((res) => res.data)
      .catch((e) => {
        if (e.response?.status === 400) {
          Swal.fire({
            title: "oops...",
            text: e.response.data,
            icon: "warning",
          });
        } else {
          Swal.fire({
            title: "oops...",
            text: "cannot login",
            icon: "error",
          });
        }
      });
  },
  register(data) {
    return axios
      .post(
        `${url}/sign-up`,
        { data },
        { withCredentials: true, credentials: "include" }
      )
      .then((res) => res.data)
      .catch((e) => {
        if (e.response?.status === 409) {
          Swal.fire({
            title: "oops...",
            text: e.response.data,
            icon: "warning",
          });
        } else {
          Swal.fire({
            title: "oops...",
            text: "cannot register",
            icon: "error",
          });
        }
      });
  },
  async refreshToken({ refreshToken, _id }) {
    try {
      const res = await axios.post(
        `${url}/refresh-token`,
        { refreshToken, _id },
        { withCredentials: true, credentials: "include" }
      );
      return res.data.accessToken;
    } catch (e) {
      console.log(e);
    }
  },
  async validate(accessToken) {
    try {
      const res = await axios.post(`${url}/validate`, { accessToken });
      return res.data;
    } catch (e) {
      console.log(e);
    }
  },
};
