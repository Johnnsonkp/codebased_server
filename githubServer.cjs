// // var gitHubconfig = {};
// var config = require('./config.cjs');
// var passport = require('passport');
// var GitHubStrategy = require('passport-github2').Strategy;



// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(obj, done) {
//   done(null, obj);
// });


// passport.use(new GitHubStrategy({
//   clientID: config.GITHUB_CLIENT_ID,
//   clientSecret: config.GITHUB_CLIENT_SECRET,
//   callbackURL: "http://127.0.0.1:5173/",
//   userAgent: 'johnnsonkp'
// },
// async (accessToken, refreshToken, profile, done, cb) => {
//   const user = await User.findOrCreate({ 
//     githubId: profile.id,
//     name: profile.username, 
//   // }, function (err, user) {
//   //   return done(err, user);
//   });
//   if (!user){
//     console.log("Adding new github user");
//     const user = new User({
//       accountId: profile.id,
//       name: profile.username,
//       provider: profile.provider
//     });
//     await user.save();
//     return cb(null, profile);
//   } else{
//     console.log("Github user already exist in DB...");
//     return cb(null, profile);
//   }
// }
// ));


// function authenticateUser(res, req){
//   passport.authenticate('github', { scope: [ 'user:email' ] });
// }

// function authCallback(res, req){ 
//   passport.authenticate('github', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   }
// }



// module.exports = {authenticateUser, authCallback};