const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const path = require('path');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');

//const password = "purple-monkey-dinosaur"; // found in the req.params object
// const hashedPassword = bcrypt.hashSync(password, 10);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession());
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
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "sample@testing.com",
    password: bcrypt.hashSync("123", 10)
  }

};

const aJ9lWpassword = bcrypt.hashSync("123", 10);
console.log(aJ9lWpassword);

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
    if (users[user].email === email) {
      console.log("match found: ", user);
      return users[user];
    }
  }
  return false;
}

// don't need it.. I think
// function accountExists(id) {
//   for (const user in users) {
//     if (id === users[user].id) return true;
//   }
//   return false;
// }


//TODO review and add comments!

function urlsForUser(urlId, id) { //where id is the url path in urls/:id
  if (urlId !== id) {// first check if the id of requested id page matches the userID
    return false;
  }
  let userDatabase = {};
  for (const shortURL in urlDatabase) { //if the path id = userID, then will search through the database to filter URLs
    if (urlDatabase[shortURL].userID === id) {
      userDatabase[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return userDatabase;
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
    return res.status(400).send("An account with that email already exists");
  }
  console.log(password);
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(hashedPassword);
  const user_id = generateRandomString();
  users[user_id] = { id: user_id, email: email, password: hashedPassword };
  res.cookie('user_id', `${user_id}`);
  res.redirect(`/urls/${user_id}`);

});

// login routes

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let user = accountCheck(email);
  if (!user) { return res.status(403).send("e-mail address cannot be found"); }
  if (bcrypt.compareSync(password, user.password)) {
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

app.get("/urls", (req, res) => {//index page that displays all urls
  const id = req.cookies.user_id;
  // if (!users[req.cookies.user_id]) {
  if (!id) {
    return res.send("<h3>Plase log in first</h3>"); //TODO create urls_noAccess.ejs?
  }
  // res.render("urls_index", templateVars);
  res.redirect(`/urls/${req.cookies.user_id}`);
  //** should be res.redirect(`/urls/${req.cookies.user_id}`)? */
});

app.get("/urls/new", (req, res) => { //page with longURL to shortURL conversion interface
  if (!users[req.cookies.user_id]) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.send("Please log in first");
  }
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.cookies.user_id };
  console.log(urlDatabase);
  res.redirect(`/urls/${req.cookies.user_id}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:id", (req, res) => { //TODO display a message if the user is not logged in / id doesn't match. 
  const urlId = req.params.id;
  const id = req.cookies.user_id;
  if (!id) { return res.send("please log in first!"); }
  if (!users[urlId]) { return res.send("Given ID doesn't exist"); };
  const userURLData = urlsForUser(urlId, id);
  if (!userURLData) { return res.send("Unauthorized account access"); }
  const templateVars = { userURLData: userURLData || {}, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, user: users[req.cookies.user_id] };
  // const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


// URL Modifications 

app.post("/urls/:shortURL/delete", (req, res) => { // deleting the shortend URL 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls/${req.cookies.user_id}`);
});

app.post("/urls/:shortURL/edit", (req, res) => { //edit button on a shortened URL leading individual page
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { shortURL, longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/update", (req, res) => { //updating the longURL 
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect(`/urls/${req.cookies.user_id}`);
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