import { Request,Response } from "express";
import { supabase } from "../db/supabase";
import jwt from "jsonwebtoken";
export const createscheduledpost = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        const { caption, url, scheduledTime  } = req.body;
        const { id, role } = decoded as { id: string, username: string, role: string };
        if (role !== "Poster"){
            return res.status(401).json({ message: "You are a viewer you cannot post" });
        }
        const { data, error } = await supabase
            .from("scheduled_posts")
            .insert({
                user_id: id,
                caption: caption,
                attachment_url: url,
                scheduled_at: scheduledTime
            });
        if (error){
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: "Scheduled post created" });
    } catch (error){
        console.error("Error creating scheduled post:", error);
        return res.status(400).json({ error: error.message });
    }
}
