var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
const bcrypt = require('bcrypt');
app.use(cookieParser())
var PORT = 8080; // default port 8080
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
//function that continues to check password if the email matches


function passwordlookup (userobject, password) {
  return (bcrypt.compareSync(password, userobject['password'])) ;

  // if (userobject['password'] === password);
  //   return true
  // } else {
  //   return false
  // }
  // return userobject['password'] === password
 }
// loops through urlDatabse to see if the input of this function matches
// userID in urlDatabase
 function urlsForUser(id) {
  const userdatabase= {};
   for (const urlObject in urlDatabase){
     if (urlDatabase[urlObject].userID === id){
       userdatabase[urlObject] = urlDatabase[urlObject];
     }
   } 
   return userdatabase;
 }


app.set("view engine", "ejs")

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
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

//this function creates a newUser object and insert it into users database
function addNewUser(email, password) {
  const newId = generateRandomString();
  const newUser = {
    id: newId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  }
  users[newId] = newUser;
  // console.log(newUser);
  return newId;
};




// function addNewUrL(longURL, userID, shortURL) {
//   const newURL = {
//     longURL: longURL,
//     userID: userID
//   }
//   urlDatabase[shortURL] = newURL;
//   console.log(newURL);
// }

var isCurrentUser = function (id) {
  if (id) {
    return true
  } else {
    // console.log("you are not logged in");
  }
}



const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// urlDatabase['b2xVn2']
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//new route handler for urls.
//render passes tempalteVars(urls object) to 'urls_index'(ejs file)
app.get("/urls", (req, res) => {
    let templateVars = { 
      urls: urlsForUser(req.cookies["user_id"]),
      userObject: users[req.cookies["user_id"]]
    };
    if (urlsForUser(req.cookies["user_id"])){
      res.render("urls_index", templateVars);
    } else {
      res.status(300).send("Please log in first!");
    }
    
    // res.render("urls_index", {abc: 123}); remember the data passed into ejs
    // is an object, then in the ejs file just type abc and 123 will show up on the webpage urls_index.
});

app.get("/urls/new", (req, res) => {
    let templateVars = { 
      urls: urlDatabase,
      userObject: users[req.cookies["user_id"]]
    };
    // console.log(req.cookies["user_id"]);
    if (req.cookies["user_id"]) {
      // console.log(urlDatabase);
      res.render("urls_new", templateVars);
    } else {
      res.render("login", templateVars);
    }
    
});

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userObject: users[req.cookies["user_id"]]
    };
    if (Object.keys(urlsForUser(req.cookies["user_id"])).length > 0){
      res.render("urls_show", templateVars);
    } else if (req.cookies["user_id"] !== urlDatabase[req.params.shortURL].userID) {
      res.status(300).send("Urls do not match!")
    } else {
      res.status(300).send("You are not logged in!")
    }
});

app.post("/urls", (req, res) => {
    // console.log(req.body);
    const longURL = req.body.longURL;
    const short = generateRandomString();
    let userID =req.cookies["user_id"];
    urlDatabase[short] = {longURL, userID};
    res.redirect('urls/' + short);
});

app.get("/u/:shortURL", (req, res) => {
    if (urlsForUser(req.cookies["user_id"])){
      // console.log(req.params.shortURL)
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlsForUser(req.cookies["user_id"])){
    let shortURL = req.params.shortURL;
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Error! This is not your URL.")
  }
    // delete urlDatabase[req.params.shortURL];
    // res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlsForUser(req.cookies["user_id"])){
    let shortURL = req.params.shortURL;
    let newlongURL = req.body.newURL;
    // console.log(urlDatabase);
    urlDatabase[shortURL].longURL = newlongURL;
    // console.log(urlDatabase);
    res.redirect("/urls");
  } else {
    res.status(403).send("Error, this is not your URL");
  }
});
// app.post("/urls/:id", (req, res) => {
//   urlDatabase[req.params.id]= req.body.newURL;
//   res.redirect("/urls/" + req.params.id);
// });

app.post("/login", (req, res) => {
  const userObject = emaillook(req.body.email);
  console.log(userObject);
  if (userObject) {
    if (passwordlookup(userObject, req.body.password)){
      res.cookie("user_id", userObject.id);
      res.redirect("/urls");
    } else { res.status(300).send("Password does not match")}
  } else { res.status(300).send("Email cannot be found")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userObject: users[req.cookies["user_id"]]
  };
  res.render("registration", templateVars)
});

app.post("/register", (req, res) => {
  //extract user's email and password from user's post request
  //put those as well as newly created id into new object
  //insert that newly created object into my user's databse
  if ((req.body.email) && (req.body.password) && (emaillookup(req.body.email) === false)){
    //set a user_id cookie containing newly generated id
    const newId = addNewUser(req.body.email, req.body.password);
    // console.log(users);
    res.cookie("user_id", newId);
    // console.log('Cookies: ', newId);
    res.redirect("/urls");
  } else if ((req.body.email) && (req.body.password) && (emaillookup(req.body.email) === true)) {
    res.status(400).send("You already registered!")
  } else {
    res.status(400).send("Please enter both your email and password!")
  }
});


app.get("/login", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userObject: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars)
});

// console.log(emaillook("user@example.com"))
// console.log(passwordlookup(emaillook('user@example.com'),'purple-monkey-dinosaur'))


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
