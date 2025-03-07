import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { createRequire } from 'module';
import express from 'express';
// import { user_model } from "./models/User.tsx";
import { user_model } from "./models/User.js";

const required = createRequire(import.meta.url);
required('dotenv').config();
const GitHubStrategy = required("passport-github2").Strategy;
const session = required("cookie-session");
const url = required('url');
// const session = required("session");
const passport = required("passport");
const app = express();
let codeChallengeTitles = []

app.use(cors());
app.use(session({secret: "secret", resave: false, saveUninitialized: true,}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let User = [];
let User_info = [];
let dir_files = {
  directories: [],
  files: []
}

app.use(function(request, response, next) {
  if (request.session && !request.session.regenerate) {
      request.session.regenerate = (cb, cors) => {
          cb()
      }
  }
  if (request.session && !request.session.save) {
      request.session.save = (cb, cors) => {
          cb()
      }
  }
  next()
})

const headerOptions = {
  "Access-Control-Allow-Origin": "*",
  Authorization: `Bearer ${process.env.VITE_APP_GITHUB_TOKEN}`,
  "Accept": "application/vnd.github.raw+json",
  "content-type": "text/plain",
  'X-Github-Api-Version': '2022-11-28'
}

const headerOptions2 = {
  "Access-Control-Allow-Origin": "*",
  Authorization: `Bearer ${process.env.VITE_APP_GITHUB_TOKEN}`,
  "Accept": "application/vnd.github.raw+json",
  // "Accept": "application/vnd.github+json",
  "content-Type": "application/json",
  'X-Github-Api-Version': '2022-11-28'
}


passport.use(new GitHubStrategy({
  clientID: process.env.VITE_STAGE_GITHUB_CLIENT_ID,
  clientSecret: process.env.VITE_STAGE_GITHUB_SECRET_KEY,
  callbackURL: process.env.VITE_STAGE_CALLBACK_URL,
},
  (accessToken, refreshToken, profile, done, cb, request) => {
    // return cb(null, profile);
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const handleLogin = async (access_token) => {
  const response = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: { 
      "Access-Control-Allow-Origin": "*",
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
  // console.log("response data:", data)
  return data
  
  if (data){
    User = [{
      avatar_url: data.avatar_url,
      login: data.login,
      name: data.name,
      id: data.id,
      type: data.type,
      followers: data.followers,
      following: data.following,
      public_repos: data.public_repos,
    }]
    // user_model = User
    // user_model = [{
    //   id: 1,
    //   github_id: data.id,
    //   avatar_url: data.avatar_url,
    //   login: data.login,
    //   name: data.name,
    //   email: data.email || 'email',
    //   bio: data.bio,
    //   location: data.location,
    //   repos_url: data.repos_url,
    //   type: data.type,
    //   followers: data.followers,
    //   following: data.following,
    //   public_repos: data.public_repos,
    //   score: 0
    // }]
    // User_info = [{ access_token: access_token }];
    // return User[0];
    // console.log("user_model", user_model)
    // return user_model;
    console.log("data backend", data)
    return data
  }
};

app.get('/api/auth/github', 
  passport.authenticate("github", { scope: ["user:email"] })
);

app.post('/auth/github/callback' , async (req, res) => {
  const { code } = req.body;
  const CLIENT_ID = process.env.VITE_STAGE_GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_STAGE_GITHUB_SECRET_KEY;

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
      }),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (accessToken) {
      handleLogin(accessToken).then((data) => res.send(data));
      // handleLogin(accessToken)
  } else {
      res.json({ success: false });
  }
});


app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) { // Check if the user is authenticated
    // const user = JSON.stringify(req.user);
    const user = req.user;

    res.send(`
      <h1>Profile</h1>
      <p>Hello, ${user.username}!</p>
      <p>Hello, ${user.access_token}!</p>
      <p>Hello, ${user}!</p>
      <a href="/api/logout">Logout</a>
    `);
  }
});

app.get("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    User = [];
    User_info = [];
    res.send("success")
  });
});

app.get("/api/repos/challenge", (req, res) => {
  let selectedChallenge = req.query.selectedChallenge;
  const select = req.query.selected_Repo;
  let directory = req.query.directory;
  const url = `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/${directory}/contents${select}${selectedChallenge}`

  if(selectedChallenge  ){
    axios({
      method: "get",
      url: url,
      UserAgent: `${process.env.VITE_APP_GITHUB_USERNAME}`,
      headers: headerOptions,
      }).then(response => {
          if(response.data){
            res.send(response.data);
          }
      }).catch(err => {
          console.log("url", url);
          res.send(err);
      });
  }
  
});


app.get("/api/repos", (req, res) => {
  let selectedRepo = req.query.selectedRepo;
  let directory = req.query.directory;
  let url = directory && directory.length > 0? 
  `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/${directory}/contents/${selectedRepo}` : 
  `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/${selectedRepo}/contents`
  
  dir_files.directories = [];
  dir_files.files = [];

  if(selectedRepo){
    codeChallengeTitles = []
    axios({
      method: "get",
      url: url,
      UserAgent: "Johnsonkp",
      headers: headerOptions,
      }).then(response => {
        if(response.data && response.data.length > 0){
          response.data.forEach((title) => {
            if (title.name && title.type == 'file'){
              dir_files.files.push(title.name)
            }
            if (title.name && title.type == 'dir') {
              dir_files.directories.push(title.name)
            }
          })
        }
        // res.send(codeChallengeTitles);
        res.send(dir_files.files)
      }).catch(err => {
          res.send(err);
      });
  }
});

app.get("/api/repos/selected_dir", (req, res) => {
  let selected_dir = req.query.selected_dir;
  let user_name = req.query.user_name || process.env.VITE_APP_GITHUB_USERNAME

  dir_files.directories = [];
  dir_files.files = [];

  if(selected_dir){
    codeChallengeTitles = []
    
    axios({
      method: "get",
      url: `https://api.github.com/repos/${user_name}/${selected_dir}/contents`,
      UserAgent: "Johnsonkp",
      headers: headerOptions,
      }).then(response => {
        if(response.data && response.data.length > 0){
          response.data.forEach((title) => {
            if (title.name && title.type == 'file'){
              dir_files.files.push(title.name)
            }
            if (title.name && title.type == 'dir') {
              dir_files.directories.push(title.name)
            }
          })
        }
        res.send(dir_files);
      }).catch(err => {
          res.send(err);
      });
  }
});

app.post("/api/repos/all", async (req, res) => {
  let dirArr = []
  let username = req.body.login || process.env.VITE_APP_GITHUB_USERNAME
  let access_token = User_info.length !== 0 && User_info[0].access_token || process.env.VITE_APP_GITHUB_TOKEN

  axios({
      method: "get",
      url: `https://api.github.com/users/${username}/repos`,
      UserAgent: username,
      headers: {
        "Access-Control-Allow-Origin": "*",
        Authorization: `Bearer ${access_token}`,
        "Accept": "application/vnd.github.raw+json",
        "content-Type": "application/json",
        'X-Github-Api-Version': '2022-11-28'
      }
  }).then(response => {
    response.data.forEach((repo) => {
      repo.name && dirArr.push(repo.name) 
    })
    res.send(dirArr)
  }).catch(err => {
      res.send(err);
  });
});

// app.post("/api/repos/default", (req, res) => {
app.get("/api/repos/default", (req, res) => {
  dir_files.directories = [];
  dir_files.files = [];

  let username = req.body.login || process.env.VITE_APP_GITHUB_USERNAME
  let access_token = User_info.length !== 0 && User_info[0].access_token || process.env.VITE_APP_GITHUB_TOKEN
  let defaultRepo = req.query.default_repo || "holbertonschool-low_level_programming"

  axios({
      method: "get",
      url: `https://api.github.com/repos/${process.env.VITE_APP_GITHUB_USERNAME}/${defaultRepo}/contents`,
      UserAgent: "Johnsonkp",
      headers: headerOptions2,
  }).then(response => {
      if (response.data) {
        response.data.forEach((dir) => {
          if(dir.type == "dir"){
            dir_files.directories.push(dir.name)
          }
          if(dir.type == "file"){
            dir_files.files.push(dir.name)
          }
        })
        res.send(dir_files);
      }
  }).catch(err => {
      console.log("res err", err.status);
      res.send(err);
  });
});

app.get("/api/user_info", (req, res) => {
  const user = req.body.user || process.env.VITE_APP_GITHUB_USERNAME;
  const userAgent = req.body.userAgent || "Johnsonkp"

  axios({
      method: "get",
      url: `https://api.github.com/users/${user}`,
      UserAgent: userAgent,
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


