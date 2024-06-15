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

export const getLikedPosts = async (req: Request, res: Response) => {
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

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: likedPosts, error: likedPostsError } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", id)
      .gte('created_at', oneWeekAgo);

    if (likedPostsError) {
      return res.status(500).json({ message: "Error fetching liked posts", error: likedPostsError.message });
    }

    if (!likedPosts || likedPosts.length === 0) {
      return res.status(404).json({ message: "No liked posts found in the last week", error: "Not Found" });
    }

    const likedPostIds = likedPosts.map(like => like.post_id);

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .in("id", likedPostIds);

    if (postsError) {
      return res.status(500).json({ message: "Error fetching posts", error: postsError.message });
    }

    const { data: saveddata, error: saveddataerror } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", id);
    if (saveddataerror) {
      return res.status(500).json({ message: "Error fetching saved posts", error: saveddataerror.message });
    }

    const savedposts = saveddata.map((save) => save.post_id);

    const likedPostsData = await Promise.all(
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
          isLiked: true,
          attachment_url: post.attachment_url,
          caption: post.caption,
          username: userData.username,
          initials: userData.firstName[0] + userData.lastName[0],
          likecount: likecountdata?.length || 0,
          created_at: post.created_at,
        };
      })
    );

    return res.status(200).json(likedPostsData);
  } catch (err) {
    console.error("Error getting liked posts:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};