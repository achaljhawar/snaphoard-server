import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import { sha256 } from "js-sha256";
import { AuthCredentialsValidator } from "../lib/zodlogin";
import { z } from "zod";
import jwt from "jsonwebtoken";
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = AuthCredentialsValidator.parse(req.body);
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
    if (error) {
      console.error("Error logging in:", error);
      return res.status(400).json({ error: error.message });
    }
    if (user) {
      if (user.password === sha256(password)) {
        const token = jwt.sign(
          { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, hashedPassword: user.password, role:  user.role},
          process.env.JWT_SECRET as string,
          {
            expiresIn: "30d",
          }
        );
        console.log({ token: token, message: "Login successful" });
        return res
          .status(200)
          .json({ token: token, message: "Login successful" });
      } else {
        return res.status(401).json({ error: "Incorrect password" });
      }
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error logging in:", err);
  }
};
