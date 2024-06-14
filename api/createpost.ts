import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import jwt from "jsonwebtoken";
import { postValidator } from "../lib/postformat";
export const createPost = async (req: Request, res: Response) => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        const { caption, url } = postValidator.parse(req.body);
        const { id, role } = decoded as { id: string, username: string, role: string };
        if (role !== "Poster"){
            return res.status(401).json({ message: "You are a viewer you cannot post" });
        }
        const { data, error } = await supabase
            .from("posts")
            .insert({
                user_id: id,
                caption: caption,
                attachment_url: url
            });
        if (error) {
            console.error("Error creating post:", error);
            return res.status(400).json({ error: error.message });
        }
        console.log("Post created");
        return res.status(200).json({ message: "Post created" });
    } catch (err) {
        console.error("Error creating post:", err);
    }
}