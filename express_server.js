const express = require("express");
const app = express();
const path = require('path');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, '/views'));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
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

function accountCheck(email) {
  for (const user in users) {
    console.log("printing checking user's email: ", users[user]['email']);
    if (users[user]['email'] === email) {
      console.log("match found: ", user);
      return users[user];
    }
  }
  return false;
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

// register route
app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send("Please provide a valid email and address");
  }
  if (!!accountCheck(email)) {
    console.log("account exists: ", accountCheck(email));
    console.log("are you printing?: ", users);
    return res.status(400).send("An account with that email already exists");
  }
  let user_id = generateRandomString();
  users[user_id] = { id: user_id, email: email, password: password };
  console.log("after post: ", users);
  res.cookie('user_id', `${user_id}`);
  return res.redirect("/urls");

});

// login routes

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let user = accountCheck(email);
  console.log(user);
  if (!user) { return res.status(403).send("e-mail address cannot be found"); }
  if (user.password === password) {
    res.cookie('user_id', `${user.id}`);
    return res.redirect("/urls");
  }
  res.status(403).send("password doesn't match");

});

// logout route

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// URL routes

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => { //index page that displays all urls
  console.log(req.body);  // Log the POST request body to the console
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${newShortURL}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: users[req.cookies.user_id] };
  // const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => { // deleting the shortend URL 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => { //edit button on a shortened URL leading individual page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req, res) => { //updating the longURL 
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newURL;
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// shortened URL routes

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});