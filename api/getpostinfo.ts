import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import { io } from "../app";
import jwt from "jsonwebtoken";
interface DecodedToken {
  id: string;
  username: string;
  hashedPassword: string;
  role: string;
  iat: number;
  exp: number;
}
export const getPostInfo = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      const { slug } = req.body;
      if (!slug) {
        return res.status(400).json({ error: "No slug provided" });
      }
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", slug)
        .single();
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user_id)
        .single();
      if (userError) {
        return res.status(500).json({ error: userError.message });
      }
      const initials = userData.firstName[0] + userData.lastName[0];
      const { data: likeData, error: likeError } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", slug);
      const likecount = likeData?.length || 0;
      const postdata = {
        caption: data.caption,
        image_url: data.attachment_url,
        username: userData.username,
        initials: initials,
        isliked: false,
        issaved: false,
        likecount: likecount,
      };
      if (!data) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(postdata);
    } else {
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
      if (!slug) {
        return res.status(400).json({ error: "No slug provided" });
      }
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", slug)
        .single();
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user_id)
        .single();
      if (userError) {
        return res.status(500).json({ error: userError.message });
      }
      const { data: likeData, error: likeError } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", slug)
        .eq("user_id", id);
      const isliked = likeData && likeData.length > 0;
      const initials = userData.firstName[0] + userData.lastName[0];
      const { data: likecountdata, error: likecounterror } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", slug);
      const {data: savedData, error: savedError} = await supabase
        .from("saved_posts")
        .select("*")
        .eq("post_id", slug)
        .eq("user_id", id);
      const issaved = savedData && savedData.length > 0;
      const likecount = likecountdata?.length || 0;
      const postdata = {
        caption: data.caption,
        image_url: data.attachment_url,
        username: userData.username,
        initials: initials,
        isliked: isliked,
        likecount: likecount,
        issaved: issaved,
      };
      if (!data) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(postdata);
    }
  } catch (err) {
    console.error("Error getting post info:", err);
  }
};
