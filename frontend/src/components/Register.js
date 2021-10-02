import React from "react";
import { useForm } from "react-hook-form";
import api from "../api";
import { useHistory, Link } from "react-router-dom";

const Register = () => {
  const history = useHistory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const user = await api.register(data);
    if (user) {
      history.push({ pathname: "/", user: user });
    }
  };

  return (
    <div className="card w-25 mx-auto mt-3 my-2">
      <img
        src="https://i.pinimg.com/originals/0c/3b/3a/0c3b3adb1a7530892e55ef36d3be6cb8.png"
        class="card-img-center mx-auto mt-5"
        alt=""
        width="70"
        height="70"
      ></img>
      <h1 className="m-auto text mb-5">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="input-group">
          <span className="input-group-text">Name</span>
          <input
            type="text"
            aria-label="First name"
            className="form-control"
            placeholder="First name"
            {...register("firstName", {
              required: "required",
              minLength: {
                value: 3,
                message: "Must containt at list 3 character",
              },
            })}
          />

          <input
            type="text"
            aria-label="Last name"
            className="form-control"
            placeholder="Last name"
            {...register("lastName", {
              required: "required",
              minLength: {
                value: 3,
                message: "Must containt at list 3 character",
              },
            })}
          />
        </div>
        <div class="container">
          <div class="row">
            {errors.lastName && (
              <p className="form-text col-6 text-end text-danger">
                {errors.lastName.message}
              </p>
            )}
            {errors.firstName && (
              <p className="form-text col-6 text-center text-danger">
                {errors.firstName.message}
              </p>
            )}
          </div>
        </div>
        <div className="card-body">
          <label for="exampleInputEmail1" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="exampleInputEmail1"
            placeholder="Email"
            aria-describedby="emailHelp"
            {...register("email", {
              required: "required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Must be a valid email",
              },
            })}
          />
          {errors.email && (
            <p className="form-text text-danger"> {errors.email.message} </p>
          )}
        </div>
        <div className="card-body">
          <label for="exampleInputPassword1">Password</label>
          <input
            type="password"
            className="form-control"
            id="exampleInputPassword1"
            name="password"
            placeholder="Password"
            {...register("password", {
              required: "required",
              pattern: {
                value: /^(?=.*?[A-Z])(?=.*?\d)(?=.*?[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g,
                message:
                  "the password must contain capital letter, number, and special character",
              },
            })}
          />
          {errors.password && (
            <p className="form-text text-danger"> {errors.password.message} </p>
          )}
        </div>
        <div className="d-flex justify-content-center my-2">
          <button type="submit" className="btn btn-secondary">
            Register
          </button>
        </div>
      </form>
      <div className="d-flex justify-content-center my-3">
        Already have an account?
        <Link to="/login" style={{ textDecoration: "none", color: "gray" }}>
          Login
        </Link>
      </div>
    </div>
  );
};

export default Register;
