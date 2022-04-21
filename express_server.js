const express = require("express");
const app = express();
const PORT = 8080;
const path = require("path");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const { accountCheck } = require('./helpers');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, '/views'));



const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  b2xVn2: {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", salt)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "sample@testing.com",
    password: bcrypt.hashSync("123", salt)
  }

};

function generateRandomString() {
  // or can use Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substring(0, 6);
  let randomString = "";
  const characterSet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const setLength = characterSet.length;
  for (let i = 0; i < 7; i++) {
    randomString += characterSet.charAt(Math.floor(Math.random() * setLength));
  }
  return randomString;
}


//TODO review and add comments!
//TODO delete all unnecessary console.logs / comments!

function urlsForUser(id) {
  let userDatabase = {};
  for (const shortURL in urlDatabase) { //if the path id = userID, then will search through the database to filter URLs
    if (urlDatabase[shortURL].userID === id) {
      userDatabase[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userDatabase;
}


app.get("/", (req, res) => { //TODO set a homepage
  res.redirect("/login");
});

// register route
app.get("/register", (req, res) => {
  console.log("printing req.session on register page: ", req.session);
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send("Please provide a valid email and address - <a href='./register'>back to register</a>");
  }
  if (!!accountCheck(email, users)) {
    return res.status(400).send("An account with that email already exists - <a href='./login'>log in</a>");
  }
  const hashedPassword = bcrypt.hashSync(password, salt);
  const user_id = generateRandomString();
  // console.log("printing req.session: ", req.session);
  req.session.user_id = user_id;
  users[req.session.user_id] = {
    id: req.session.user_id,
    email: email,
    password: hashedPassword
  };
  // console.log("printing req.session.user_id: ", req.session.user_id);
  // console.log("printing user database: ", users);
  // res.cookie('user_id', `${user_id}`);
  res.redirect(`/urls/`);

});

app.use((req, res, next) => {
  if (!req.session.user_id && req.path !== "/login") {
    return res.redirect('/login');
  }

  next();
});



// login routes

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(users);
  let user = accountCheck(email, users);
  if (!user) { return res.status(403).send('<h4>e-mail address cannot be found - please <a href="./login">log in again</a> or <a href="./register">register</a></h4>'); }
  if (bcrypt.compareSync(password, user.password)) {
    // res.cookie('user_id', `${user.id}`);
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
  res.status(403).send("password doesn't match");

});

// logout route

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// URL routes

app.get("/urls", (req, res) => {//index page that displays all urls
  const id = req.session.user_id;
  // if (!users[req.cookies.user_id]) {
  if (!id) {
    return res.send("<a href='/login'><h3>Plase log in first</h3></a>"); //TODO create urls_noAccess.ejs?
  }
  // res.render("urls_index", templateVars);
  // res.redirect(`/urls/${req.session.user_id}`);
  const userURLData = urlsForUser(id);
  // if (!userURLData) { return res.send("Unauthorized account access"); }
  const templateVars = { userURLData: userURLData || {}, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { //page with longURL to shortURL conversion interface
  if (!users[req.session.user_id]) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.send("Please log in first");
  }
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  console.log(urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

// app.get("/urls/:id", (req, res) => { //TODO display a message if the user is not logged in / id doesn't match. 
//   const urlId = req.params.id;
//   const id = req.session.user_id;
//   if (!id) { return res.send("please log in first!"); }
//   if (!users[urlId]) { return res.send("Given ID doesn't exist"); };
//   const userURLData = urlsForUser(urlId, id);
//   if (!userURLData) { return res.send("Unauthorized account access"); }
//   const templateVars = { userURLData: userURLData || {}, user: users[req.session.user_id] };
//   res.render("urls_index", templateVars);
// });

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;
  if (!id) { return res.send("please log in first!"); }

  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: users[req.session.user_id] };
  // const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


// URL Modifications 

app.post("/urls/:shortURL/delete", (req, res) => { // deleting the shortend URL 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls/${req.session.user_id}`);
});

app.post("/urls/:shortURL/edit", (req, res) => { //edit button on a shortened URL leading individual page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { shortURL, longURL, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req, res) => { //updating the longURL 
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect(`/urls/${req.session.user_id}`);
});

// shortened URL routes

app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase);
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});