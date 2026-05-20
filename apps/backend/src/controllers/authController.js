import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { writeAuditLog } from "../services/auditService.js";

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const response = {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };

  void writeAuditLog({
    action: "auth.login",
    actor: user.email,
    details: { role: user.role }
  }).catch((error) => {
    console.error("Failed to write login audit log", error);
  });

  return res.json(response);
}
