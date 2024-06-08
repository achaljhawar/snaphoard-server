import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../db/supabase";
export const checkAuth = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ message: "Invalid token", error: "Invalid token" });
      }
      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Invalid token', error: 'Invalid token' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      const { id, username, hashedPassword, role, iat, exp } = decoded
      const currentTime = Math.floor(Date.now() / 1000);
      if (exp < currentTime) {
        return res.status(401).json({ message: 'Token expired', error: 'Token expired' });
      }
      const { data: user, error} = await supabase
        .from("users")
        .select("*")
        .eq("id", id);
      if (error) { 
        console.error("Error checking auth:", error);
        return res.status(400).json({ error: error.message });
      }
      if (user && user.length > 0) {
        if (user[0].username === username && user[0].password === hashedPassword && user[0].role === role) {
          return res.status(200).json({ message: "Authenticated" });
        } else {
          return res.status(401).json({ message: "Invalid token", error: "Invalid token" });
        }
      } else {
        return res.status(404).json({ message: "User not found", error: "User not found" });
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Invalid token", error: "Invalid token" });
    }
  };
  