import { Request, Response } from "express";
import { supabase } from "../db/supabase";
import nodemailer from "nodemailer";
import { sha256 } from "js-sha256";
import { authcodecreator, generateEightDigitNumber } from "../lib/utils";
import { AuthCredentialsValidator } from "../lib/zodsignup";
import { z } from "zod";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  auth: {
    user: process.env.EMAIL as string,
    pass: process.env.EMAIL_PASSWORD as string,
  },
});
async function sendVerificationEmail(
  email: string,
  verifyUrl: string,
  verification_code: string
) {
  try {
    const mailOptions = {
      to: email,
      subject: "Verify your email address",
      html: `
      <html>
      <head>
         <title>SnapHoard</title>
         <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
      
             body {
                 background-color: white;
                 display: flex;
                 justify-content: center;
                 align-items: center;
                 height: 100vh;
                 margin: 0;
                 font-family: 'Inter', sans-serif;
             }
             .card {
                 background-color: white;
                 border-radius: 0.5rem;
                 padding: 1.5rem;
                 max-width: 600px;
                 text-align: center;
             }
             .title {
                 font-size: 1.875rem;
                 font-weight: 700;
                 color: #1a202c;
                 margin-bottom: 0.5rem;
             }
             .text {
                 color: #6b7280;
             }
             .verification-code {
                 background-color: #f7fafc;
                 border-radius: 0.5rem;
                 padding: 1.5rem;
                 font-size: 4rem;
                 font-weight: 700;
                 color: #1a202c;
             }
             .button {
                 display: inline-flex;
                 align-items: center;
                 justify-content: center;
                 height: 2.5rem;
                 padding-left: 1.5rem;
                 padding-right: 1.5rem;
                 border-radius: 0.375rem;
                 background-color: #1a202c;
                 color: white;
                 transition: background-color 0.15s ease-in-out;
                 text-decoration: none;
             }
             .button:hover {
                 background-color: rgba(26, 32, 44, 0.9);
             }
             .button:focus {
                 outline: 2px solid transparent;
                 outline-offset: 2px;
                 box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
             }
         </style>
      </head>
      <body>
         <div class="card">
             <h1 class="title">Welcome to SnapHoard!</h1>
             <p class="text">
                 To complete your account setup, please enter the verification code below.
             </p>
             <div class="verification-code">${verification_code}</div>
             <p class="text">
                 SnapHoard is a web application where users can be either posters (who upload images with captions) or
                 viewers. Explore the platform and connect with others who share your interests.
             </p>
             <a href="${verifyUrl}" class="button">Go to SnapHoard</a>
         </div>
      </body>
      </html>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}
export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email, password, role } =
      AuthCredentialsValidator.parse(req.body);

    let { data: user_email, error: emerr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("isverified", true);
    if (emerr) {
      console.error("Error creating user:", emerr);
      return res.status(400).json({ error: emerr.message });
    }
    if (user_email && user_email.length > 0) {
      return res.status(401).json({ error: "Email already exists" });
    }
    let { data: user_username, error: unerr } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("isverified", true);
    if (unerr) {
      console.error("Error creating user:", unerr);
      return res.status(400).json({ error: unerr.message });
    }
    if (user_username && user_username.length > 0) {
      return res.status(402).json({ error: "Username already exists" });
    }
    let { data: veriuser, error: verierr } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("isverified", false)
      .eq("email", email);
    if (verierr) {
      console.error("Error creating user:", verierr);
      return res.status(400).json({ error: verierr.message });
    }
    if (veriuser && veriuser.length > 0) {
      console.log(veriuser[0].verification_code);
      const verification_code = veriuser[0].verification_code;

      const verifyUrl =
        process.env.FRONTEND_URL +
        "/auth/verify?email=" +
        email +
        "&verification_code=" +
        verification_code;
      await sendVerificationEmail(email, verifyUrl, verification_code);
      return res
        .status(403)
        .json({ error: "User already exists but not verified" });
    }
    const verification_code = authcodecreator(6);
    const hashedPassword = sha256(password);
    const id = generateEightDigitNumber();
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: id,
          firstName: firstName,
          lastName: lastName,
          username: username,
          email: email,
          password: hashedPassword,
          role: role,
          verification_code: verification_code,
          oauthprovider: "password",
          isverified: false,
        },
      ]);
    if (error) {
      console.error("Error creating user:", error);
      return res.status(400).json({ error: error.message });
    }
    const verifyUrl =
      process.env.FRONTEND_URL +
      "/auth/verify?email=" +
      email +
      "&verification_code=" +
      verification_code;
    await sendVerificationEmail(email, verifyUrl, verification_code);
    return res.status(200).json({ message: "User created successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }

    console.error("Error creating user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
