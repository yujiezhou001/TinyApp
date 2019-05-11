//All required packages

var express = require("express");
var app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var cookieSession = require('cookie-session');

app.use(
  cookieSession({
  name: 'session',
  keys: ["home"]
})
);

const bcrypt = require('bcrypt');
app.set("view engine", "ejs");

var PORT = 8080;


//function that generates new id
function generateRandomString() {
    return Math.random()
      .toString(36)
      .substring(7);
}

//function that returns true if email is in the users database
function emaillookup (emailinput) {
  for (const idObject in users) {
    if (users[idObject].email === emailinput){
      return true;
    }
  }
  return false;
}

//function that returns entire object if email is in the users database
function emaillook (emailinput) {
  for (const idObject in users) {
    if (users[idObject].email === emailinput){
      return users[idObject];
    }
  }
  return false;
}

//function that check if password matches
function passwordlookup (userobject, password) {
  return (bcrypt.compareSync(password, userobject['password'])) ;

  // if (userobject['password'] === password);
  //   return true
  // } else {
  //   return false
  // }
  // return userobject['password'] === password
 }

// function that loops through urlDatabse to see if the input of this function matches
// userID in urlDatabase, then returns a filtered object
 function urlsForUser(id) {
  const userdatabase= {};
   for (const urlObject in urlDatabase){
     if (urlDatabase[urlObject].userID === id){
       userdatabase[urlObject] = urlDatabase[urlObject];
     }
   } 
   return userdatabase;
 }

// default url database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

//default users database
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

//this function creates a newUser object and insert it into users database
function addNewUser(email, password) {
  const newId = generateRandomString();
  const newUser = {
    id: newId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  }
  users[newId] = newUser;
  return newId;
};

//Route handlers for urls
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Home page
app.get("/urls", (req, res) => {
    let templateVars = { 
      urls: urlsForUser(req.session.user_id),
      userObject: users[req.session.user_id]
    };
    if (urlsForUser(req.session.user_id)){
      res.render("urls_index", templateVars);
    } else {
      res.status(300).send("Please log in first!");
    }
});

//App page
app.get("/urls/new", (req, res) => {
    let templateVars = { 
      urls: urlDatabase,
      userObject: users[req.session.user_id]
    };
    if (req.session.user_id) {
      res.render("urls_new", templateVars);
    } else {
      res.render("login", templateVars);
    }
    
});

//Created short URL page
app.get("/urls/:shortURL", (req, res) => {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userObject: users[req.session.user_id]
    };
    if (Object.keys(urlsForUser(req.session.user_id)).length > 0){
      res.render("urls_show", templateVars);
    } else if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
      res.status(300).send("Urls do not match!");
    } else {
      res.status(300).send("You are not logged in!");
    }
});


app.post("/urls", (req, res) => {
    const longURL = req.body.longURL;
    const short = generateRandomString();
    let userID = req.session.user_id;
    urlDatabase[short] = {longURL, userID};
    res.redirect('urls/' + short);
});

//Redirect to long URLs
app.get("/u/:shortURL", (req, res) => {
  if (urlsForUser(req.session.user_id)){
    let longUrl = urlDatabase[req.params.shortURL].longURL;
    const prefix = 'http';
    if (longUrl.substr(0, prefix.length) !== prefix){
      longUrl = prefix + 's://' + longUrl;
    }
    res.redirect(longUrl);
  }
});

//Delete button on home page
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlsForUser(req.session.user_id)){
    let shortURL = req.params.shortURL;
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Error! This is not your URL.")
  }
});

//Update created short URLs with new ones
app.post("/urls/:shortURL", (req, res) => {
  if (urlsForUser(req.session.user_id)){
    let shortURL = req.params.shortURL;
    let newlongURL = req.body.newURL;
    urlDatabase[shortURL].longURL = newlongURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("Error, this is not your URL");
  }
});

//Login Button
app.post("/login", (req, res) => {
  const userObject = emaillook(req.body.email);
  if (userObject) {
    if (passwordlookup(userObject, req.body.password)){
      req.session.user_id = userObject.id;
      res.redirect("/urls");
    } else { res.status(300).send("Password does not match")};
  } else { res.status(300).send("Email cannot be found");
  }
});

//Logout Button
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//Register Page
app.get("/register", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userObject: users[req.session.user_id]
  };
  res.render("registration", templateVars)
});

//Register Button
app.post("/register", (req, res) => {
  
  if ((req.body.email) && (req.body.password) && (emaillookup(req.body.email) === false)){
    const newId = addNewUser(req.body.email, req.body.password);
    req.session.user_id = newId;
    res.redirect("/urls");
  } else if ((req.body.email) && (req.body.password) && (emaillookup(req.body.email) === true)) {
    res.status(400).send("You already registered!");
  } else {
    res.status(400).send("Please enter both your email and password!");
  }
});

//Login Page
app.get("/login", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userObject: users[req.session.user_id]
  };
  res.render("login", templateVars);
});

//Server status
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
