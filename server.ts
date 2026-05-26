import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json({ limit: "50mb" })); // Enable JSON body parsing with large limit
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = (username || "").trim().toLowerCase();

    if (normalizedUsername === "admin" && password === "56Ramadhan47") {
      return res.json({
        id: "admin-session-id",
        username: "admin",
        role: "admin",
        name: "Super Admin",
        isKM: false
      });
    } else if (normalizedUsername === "konselor" && password === "konselor") {
      return res.json({
        id: "bk-session-id",
        username: "konselor",
        role: "counselor",
        name: "Guru BK / Konselor",
        isKM: false
      });
    }

    return res.status(401).json({ message: "Username atau password salah." });
  });

  app.post("/api/change-password", (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword, accountType } = req.body;

    // TODO: Implement password change logic here
    console.log({
      currentPassword,
      newPassword,
      confirmNewPassword,
      accountType,
    });

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match." });
    }

    // Placeholder for actual password change logic
    // In a real application, you would:
    // 1. Authenticate the user and verify the current password.
    // 2. Hash the new password.
    // 3. Update the password in the database for the specified account type.

    res.json({ message: "Password change request received. (Not yet implemented)" });
  });

  // API to backup (export) all localStorage data
  app.get("/api/backup-data", (req, res) => {
    // In a real application, this would fetch data from a database.
    // For this demo, we assume client-side localStorage data is sent to the server for backup.
    // The client will send its localStorage data to this endpoint.
    res.status(200).json({ message: "Client should send localStorage data to be backed up." });
  });

  // API to restore (import) data into localStorage
  app.post("/api/restore-data", (req, res) => {
    const dataToRestore = req.body;
    if (!dataToRestore || typeof dataToRestore !== 'object') {
      return res.status(400).json({ message: "Invalid data format for restore." });
    }
    // In a real application, this would save data to a database.
    // For this demo, we'll send the data back to the client to update its localStorage.
    res.status(200).json({ message: "Data received for restore. Client should now update its localStorage.", data: dataToRestore });
  });

  // API for cloud sync simulation locally using file-based storage has been removed.
  // API requests to /api/sync will now fall through to Vite proxy.

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const projectRoot = __dirname;
    const vite = await createViteServer({
      root: projectRoot,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));

    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const url = `http://localhost:${PORT}`;
    const start = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    exec(`${start} ${url}`);
  });
}

startServer();
