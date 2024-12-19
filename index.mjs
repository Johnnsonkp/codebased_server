import { headerOptions, headerOptions2, headerOptions3 } from "./headers.js";

import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { createRequire } from 'module';
import express from 'express';

const required = createRequire(import.meta.url);
required('dotenv').config();
const GitHubStrategy = required("passport-github2").Strategy;
const session = required("cookie-session");
const passport = required("passport");
const app = express();
let codeChallengeTitles = []

app.use(session({secret: "secret", resave: false, saveUninitialized: true,}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

passport.use(new GitHubStrategy({
  clientID: process.env.VITE_STAGE_GITHUB_CLIENT_ID,
  clientSecret: process.env.VITE_STAGE_GITHUB_SECRET_KEY,
  callbackURL: process.env.VITE_STAGE_CALLBACK_URL,
},
  (accessToken, refreshToken, profile, done, cb) => {
    return cb(null, profile);
  }
));

const handleLogin = async (access_token) => {
  const response = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: { 
      "Accept": "application/vnd.github+json",
      'X-GitHub-Api-Version': '2022-11-28',
      "Authorization": `Bearer ${access_token}`
    },
  })
  if (!response.ok) {
    console.error(`Error: ${response.status} - ${response.statusText}`);
    return;
  }
  const data = await response.json();
  console.log("data handlelogin:", data);   
  return data;
};

app.get('/', (req, res) => {
  res.send(
    `<div style={{display: 'flex'}}>
      <a href="/api/auth/github">Login with Github</a>
      <a href="/logout">Logout</a>
      <a href="/profile">Profile</a>
      <a href="/api/auth/github/callback">Callback with Github</a>
    </div>`
  );
});

app.get(
  '/api/auth/github', 
  passport.authenticate("github", { scope: ["user:email"] }),
  (req, res) => {
    // res.redirect('/profile');
  }
);

app.get('/api/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/' }), 
  (req, res) => {
    res.redirect('/profile');
  }
);

app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) { // Check if the user is authenticated
    // const user = JSON.stringify(req.user);
    const user = req.user;
    handleLogin(user.access_token).then(data => console.log("logged in", data))

    res.send(`
      <h1>Profile</h1>
      <p>Hello, ${user.username}!</p>
      <p>Hello, ${user.access_token}!</p>
      <p>Hello, ${user}!</p>
      <a href="/logout">Logout</a>
    `);
  } 
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.send("success")
  });
});

app.get("/api/repos/challenge", (req, res) => {
  let selectedChallenge = req.query.selectedChallenge;
  let selectedRepo = req.query.selectedRepo; 

  if(selectedChallenge){
    axios({
      method: "get",
      url: `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/holbertonschool-low_level_programming/contents/${selectedRepo}/${selectedChallenge}`,
      UserAgent: `${process.env.VITE_APP_GITHUB_USERNAME}`,
      headers: headerOptions,
      }).then(response => {
          if(response.data){
            res.send(response.data);
          }
      }).catch(err => {
          res.send(err);
      });
  }
});


app.get("/api/repos", (req, res) => {
  let selectedRepo = req.query.selectedRepo;
  if(selectedRepo){
    codeChallengeTitles = []
    axios({
      method: "get",
      url: `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/holbertonschool-low_level_programming/contents/${selectedRepo}`,
      UserAgent: "Johnsonkp",
      headers: headerOptions,
      }).then(response => {
        if(response.data){
          response.data.forEach((title) => {
            if(title.name && title.name[title.name.length - 1] == "c" && title.name[title.name.length - 2] == "." && !title.name.includes("main")){
              codeChallengeTitles.push(title.name);
            }
          })
        }
        res.send(codeChallengeTitles);
      }).catch(err => {
          res.send(err);
      });
  }
});

app.get("/api/repos/all", (req, res) => {
  let dirArr = []
  axios({
      method: "get",
      url: `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}`,
      UserAgent: "Johnsonkp",
      headers: headerOptions2,
  }).then(response => {
    res.send(response.data);
  }).catch(err => {
      res.send(err);
  });
});

app.get("/api/repos/default", (req, res) => {
  let dirArr = []
  axios({
      method: "get",
      url: `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/holbertonschool-low_level_programming/contents`,
      UserAgent: "Johnsonkp",
      headers: headerOptions2,
  }).then(response => {
      response.data.forEach((dir) => {
        if(dir.type == "dir"){
          dirArr.push(dir.name)
        }
      })
      res.send(dirArr);
  }).catch(err => {
      res.send(err);
  });
});


app.get("/api/user_info", (req, res) => {
  axios({
      method: "get",
      url: `https://api.github.com/users/${process.env.VITE_APP_GITHUB_USERNAME}`,
      UserAgent: "Johnsonkp",
      headers: headerOptions2,
  }).then(response => {
      res.send(response.data);
  }).catch(err => {
      res.send(err);
  });
});

app.get("/api", (req, response) => {
  response.json({message: "Connected to node server"});
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});