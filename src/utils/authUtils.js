import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

export const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const findUserByEmail = async (email) => {
  return await User.query().where("email", email).first();
};
