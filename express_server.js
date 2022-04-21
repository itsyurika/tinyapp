const express = require("express");
const app = express();
const PORT = 8080;
const path = require("path");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const { helperFunctions } = require('./helpers');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const urlDatabase = {};
const users = {};
const { accountCheck, generateRandomString, urlsForUser } = helperFunctions(urlDatabase);



// ** routes ** //

app.get("/", (req, res) => {
  res.redirect("/login");
});

// register route
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
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
  req.session.user_id = user_id;
  users[req.session.user_id] = {
    id: req.session.user_id,
    email: email,
    password: hashedPassword
  };
  res.redirect("/urls");

});

// login routes

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = accountCheck(email, users);
  if (!user) { return res.status(403).send("<h4>e-mail address cannot be found - please <a href='./login'>log in again</a> or <a href='./register'>register</a></h4>"); }
  if (bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  }
  res.status(403).send('Password does not match - please check your input and <a href="./login">try again</a>');
});

// logout route

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// URL routes

app.get("/urls", (req, res) => {//index page that displays all urls
  if (!req.session.user_id) {
    return res.send("Please <a href='./login'>log in</a> or <a href='./register'>register first</a>");
  }
  const id = req.session.user_id;
  const userURLData = urlsForUser(id);
  const templateVars = { userURLData: userURLData || {}, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Please <a href='/login'>log in</a> or <a href='/register'>register first</a>");
  }
  const shortURL = req.params.shortURL;
  const userURLData = urlsForUser(req.session.user_id);
  if (userURLData[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = { shortURL, longURL, user: users[req.session.user_id] };
    return res.render("urls_show", templateVars);
  }
  if (urlDatabase[shortURL]) {
    return res.send("Unauthorized access");
  }
  res.send("The shortened URL doesn't exist");

});

// URL Modifications 

app.post("/urls/:shortURL/delete", (req, res) => { // deleting the shortend URL 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
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
  res.redirect("/urls");
});

// shortened URL routes

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.send("The requested URL doesn't exist");
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});