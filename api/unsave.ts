import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase";
import { io } from "../app";
interface DecodedToken {
  id: string;
  username: string;
  hashedPassword: string;
  role: string;
  iat: number;
  exp: number;
}
export const unsave = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Invalid token", error: "Invalid token" });
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ message: "Invalid token", error: "Invalid token" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;
    const { id, username, hashedPassword, role, iat, exp } = decoded;
    const currentTime = Math.floor(Date.now() / 1000);
    if (exp < currentTime) {
      return res
        .status(401)
        .json({ message: "Token expired", error: "Token expired" });
    }
    const { slug } = req.body;
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("post_id", slug)
      .eq("user_id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "Post not saved" });
    }

    const { data: saved, error: savedError } = await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", slug)
      .eq("user_id", id);

    if (savedError) {
      return res.status(500).json({ error: savedError.message });
    }

    return res.status(200).json({ message: "Post unsaved successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: "An error occurred" });
  }
};
