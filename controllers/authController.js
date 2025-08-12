require("dotenv").config();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../generated/prisma"); // adjust if needed
const prisma = new PrismaClient();
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "replace_me";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);

// --- Setup NodeMailer transporter ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Helpers ---
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOTP(to, otp) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: "Your Bus Management OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bus Management</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #2e86de;">${otp}</h1>
          <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        </div>
      `,
    });
    console.log(`✅ OTP sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send OTP:", err);
  }
}

async function saveOTP(userId, otpCode, otpType) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return prisma.oTP.create({
    data: {
      user_id: userId,
      otp_code: otpCode,
      otp_type: otpType,
      expires_at: expiresAt,
    },
  });
}

// --- Controllers ---

// 1. Request Registration OTP
module.exports.requestRegistrationOTP = async (req, res) => {
  try {
    const { email, name, phone, company_name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user && user.is_verified) {
      return res.status(400).json({ error: "User already exists" });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || null,
          email,
          phone: phone || null,
          company_name: company_name || null,
          is_verified: false,
        },
      });
    }

    const otp = generateOTP();
    await saveOTP(user.id, otp, "REGISTRATION");
    await sendOTP(email, otp);

    res.json({ message: "OTP sent for registration" });
  } catch (error) {
    console.error("Request Registration OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Verify Registration OTP
module.exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        user_id: user.id,
        otp_code: otp,
        otp_type: "REGISTRATION",
        is_used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!otpRecord) return res.status(400).json({ error: "Invalid or expired OTP" });

    await prisma.$transaction([
      prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { is_verified: true },
      }),
    ]);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Verify Registration OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3. Request Login OTP
module.exports.requestLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_verified) {
      return res.status(404).json({ error: "User not found or not verified" });
    }

    const otp = generateOTP();
    await saveOTP(user.id, otp, "LOGIN");
    await sendOTP(email, otp);

    res.json({ message: "OTP sent for login" });
  } catch (error) {
    console.error("Request Login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4. Verify Login OTP
module.exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_verified) {
      return res.status(404).json({ error: "User not found or not verified" });
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        user_id: user.id,
        otp_code: otp,
        otp_type: "LOGIN",
        is_used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!otpRecord) return res.status(400).json({ error: "Invalid or expired OTP" });

    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Verify Login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
