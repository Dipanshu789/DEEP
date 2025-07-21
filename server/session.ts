import session from "express-session";

export default session({
  secret: process.env.SESSION_SECRET || "attendance_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});
