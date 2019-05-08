var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
function generateRandomString() {
    return Math.random()
      .toString(36)
      .substring(7);
}



app.set("view engine", "ejs")

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
    // res.render("urls_index", {abc: 123}); remember the data passed into ejs
    // is an object, then in the ejs file just type abc and 123 will show up on the webpage urls_index.
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
  });

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
    res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
    console.log(req.body);  // Log the POST request body to the console
    const long = req.body.longURL;
    const short = generateRandomString();
    urlDatabase[short] = long;
    res.redirect('urls/' + urlDatabase[short]);
});

app.get("/u/:shortURL", (req, res) => {

    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls")
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});