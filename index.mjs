import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { createRequire } from 'module';
import { dirname } from "path";
import express from 'express';
import { fileURLToPath } from "url";
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
const fs = required("fs");
const path = required("path");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QUIZ_FOLDER = path.join(__dirname, "QuizItems");

app.use(cors());
app.use(session({secret: "secret", resave: false, saveUninitialized: true,}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/api/quiz-items/categories", (req, res) => {
  try{
    const categories = fs.readdirSync(QUIZ_FOLDER).filter(folder =>
      fs.statSync(path.join(QUIZ_FOLDER, folder)).isDirectory()
    );
    res.send(categories);
  }catch (error){
    console.error("Error fetching categories:", error);
  }
})

app.post("/api/quiz-items/quizes", (req, res) => {
  const category = req.body.category
  const categoryPath = path.join(QUIZ_FOLDER, category);
  
  try{
    const files = fs.readdirSync(categoryPath);
    const jsonFiles = files.filter(file => file.endsWith(".json"));
    
    const jsonData = jsonFiles.map(file => {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, "utf8");

      return JSON.parse(content);
  });
  // console.log("json", jsonData)
  res.json(jsonData);
  
  }catch (error){
    console.error("Error fetching categories:", error);
  }
})

app.post("/api/quiz-items/selected-quiz", (req, res) => {
  const category = req.body.category
  const categoryPath = path.join(QUIZ_FOLDER, category);
  
  try{
    if (!fs.existsSync(categoryPath)) {
      return res.status(404).json({ error: "Category not found." });
    }
    
    const files = fs.readdirSync(categoryPath);
    const jsonFiles = files.filter(file => file.endsWith(".json"));
    
    const jsonData = jsonFiles.map(file => {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    });

    res.json(jsonData);
  } catch (error){
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error." });
  }
})

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
  return data
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
      const data = await handleLogin(accessToken);
      res.send(data);
  } else {
      res.json({ success: false });
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
    let codeChallengeTitles = []
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
    let codeChallengeTitles = []
    
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
              // dir_files.files.push({name: title.name, type: "file"})
            }
            if (title.name && title.type == 'dir') {
              dir_files.directories.push(title.name)

              // dir_files.directories.push({name: title.name, type: "directory"})
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


