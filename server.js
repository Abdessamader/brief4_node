const express = require("express");
const app = express();
const session = require("express-session");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const ejs = require("ejs");
const path = require("path");
const cookieParser = require("cookie-parser");
const { redirect } = require("express/lib/response");

// create connexion
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "Y2_brief4",
});

let tt = db.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use(
  session({
    secret: "something",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// User is not authenticated
function isNotAuth(req, res, next) {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("register");
  }
}

// User is authenticated
const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    console.log("not allowed");
    res.redirect("register");
  }
};

// Current user
function currentUser(req, res, next) {
  if (req.session.userEmail) {
    res.locals.userEmail = req.session.userEmail;
    next();
  } else {
    res.locals.userEmail = null;
    next();
  }
}

app.get("/index", isAuth, (req, res) => {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs", { message: "" });
});

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, cont) => {
    if (err) throw err;
    console.log(res);
    ejs.renderFile("views/index.ejs", { cont }, (error, content) => {
      if (error) throw error;

      res.end(content);
    });
  });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  db.query(
    `SELECT email FROM users WHERE email = '${email}'`,
    async (error, results) => {
      if (error) {
        console.log(error);
      } else if (results.length > 0) {
        return res.render("register", {
          message: "That email is already used ",
        });
      } else {
        try {
          const hashPassword = await bcrypt.hash(password, 10);

          db.query(
            `INSERT INTO users (username,email,password) VALUES ('${username}','${email}','${hashPassword}')`,
            function (err, result) {
              if (err) throw console.log(err);
              // res.redirect("register?name=register");
              res.redirect("register");
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
    }
  );
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  db.query(
    `SELECT * FROM users WHERE email = '${email}'`,
    function (err, results) {
      let hashedPassword = results[0].password;
      if (
        bcrypt.compare(password, hashedPassword, function (err, result) {
          if (result == true) {
            console.log("User login successful.");
            req.session.isAuth = true;
            req.session.userEmail = email;
            console.log(req.session);
            res.redirect("index");
          } else {
            console.log("not connected");
          }
        })
      );
    }
  );
});
app.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) throw error;
    console.log("User logout.");
    res.redirect("register");
  });
});

app.listen(3000);
