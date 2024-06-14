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
export const addLike = async (req: Request, res: Response) => {
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
      .from("post_likes")
      .select("*")
      .eq("post_id", slug)
      .eq("user_id", id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (data && data.length > 0) {
      return res.status(400).json({ message: "Already liked" });
    }
    const { data: like, error: likeError } = await supabase
      .from("post_likes")
      .insert({
        post_id: slug,
        user_id: id,
      });
    if (likeError) {
      return res.status(500).json({ error: likeError.message });
    }
    io.emit("add-like",{
        post_id: slug,
        user_id: id
    })
    return res.status(200).json({ message: "Liked" });
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ message: "Invalid token", error: "Invalid token" });
  }
};
