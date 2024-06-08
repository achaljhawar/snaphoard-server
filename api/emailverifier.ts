import { Request, Response } from "express";
import { supabase } from "../db/supabase";
export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { email, verification_code } = req.body;
        if (!email || !verification_code) {
            return res.status(400).json({ error: "Email and verification code are required" });
        }
        const { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("verification_code", verification_code);
        if (error) {
            console.error("Error verifying user:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
        if (!users || users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        if (users[0].isverified) {
            return res.status(200).json({ error: "User already verified" });
        }
        const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ isverified: true })
            .eq("id", users[0].id);
        if (updateError) {
            console.error("Error verifying user:", updateError);
            return res.status(500).json({ error: "Internal server error" });
        }
        return res.status(200).json({ message: "User verified successfully" });
    } catch (error) {
        console.error("Error verifying user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}