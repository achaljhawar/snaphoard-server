import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  username: string;
  hashedPassword: string;
  role: string;
  iat: number;
  exp: number;
}

export const getAllPostInfo = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header provided", error: "Unauthorized" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid token format", error: "Unauthorized" });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token", error: "Unauthorized" });
    }

    const { id } = decoded;
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(401).json({ message: "Token expired", error: "Unauthorized" });
    }

    const { data: posts, error: postError } = await supabase.from("posts").select("*");
    if (postError) {
      return res.status(500).json({ message: "Error fetching posts", error: postError.message });
    }

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found", error: "Not Found" });
    }

    const { data: likedata, error: likedataerror } = await supabase
      .from("post_likes")
      .select("*")
      .eq("user_id", id);
    if (likedataerror) {
      return res.status(500).json({ message: "Error fetching liked posts", error: likedataerror.message });
    }

    const { data: saveddata, error: saveddataerror } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", id);
    if (saveddataerror) {
      return res.status(500).json({ message: "Error fetching saved posts", error: saveddataerror.message });
    }

    const likedposts = likedata.map((like) => like.post_id);
    const savedposts = saveddata.map((save) => save.post_id);

    const allpostdata = await Promise.all(
      posts.map(async (post) => {
        const { data: likecountdata, error: likecounterror } = await supabase
          .from("post_likes")
          .select("*")
          .eq("post_id", post.id);
        if (likecounterror) {
          throw new Error(`Error fetching like count for post ${post.id}: ${likecounterror.message}`);
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", post.user_id)
          .single();
        if (userError) {
          throw new Error(`Error fetching user data for post ${post.id}: ${userError.message}`);
        }

        return {
          id: post.id,
          isSaved: savedposts.includes(post.id),
          isLiked: likedposts.includes(post.id),
          attachment_url: post.attachment_url,
          caption: post.caption,
          username: userData.username,
          initials: userData.firstName[0] + userData.lastName[0],
          likecount: likecountdata?.length || 0,
        };
      })
    );

    return res.status(200).json(allpostdata);
  } catch (err) {
    console.error("Error getting all post info:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};