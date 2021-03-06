var express = require('express');

// This gives us access to the user "model".
var model = require('../lib/user');

var course_helper = require('../lib/course_helper');

var major_helper = require('../lib/major_helper');

var user_progress = require('../lib/user_progress');

// This creates an express "router" that allows us to separate
// particular routes from the main application.
var router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/user/main');
});

// Provides a login view
router.get('/login', (req, res) => {
  // Grab the session if the user is logged in.
  var user = req.session.user;
  // Redirect to main if session and user is online:
  if (user) {
    res.redirect('/user/main');
  }
  else{
    var message = req.flash('login') || '';
    res.render('login', { title: 'User Login', message: message});
  }
});

// Performs **basic** user authentication.
router.post('/auth', (req, res) => {
  // Grab the session if the user is logged in.
  var user = req.session.user;
  // Redirect to main if session and user is online
  if (user) {
    res.redirect('/user/main');
  }
  else {
    // Pull the values from the form:
    var name = req.body.name;
    var pass = req.body.pass;

    if (!name || !pass) {
      req.flash('login', 'did not provide the proper credentials');
      res.redirect('/user/login');
    }
    else {
      model.verify(name, pass, function(error, user) {
        if (error) {
          // Pass a message to login:
          req.flash('login', error);
          res.redirect('/user/login');
        }
        else {

          // create a session variable to represent stateful connection
          req.session.user = user;

          // Pass a message to main:
          req.flash('main', 'authentication successful');
          res.redirect('/user/main');
        }
      });
    }
  }
});

router.post('/new', (req, res) => {
  res.redirect('/user/new');
});

router.post('/new/create', (req, res) => {
  var name = req.body.name;
  var pass = req.body.pass;
  var admin = false;
  var user = {name : name, pass : pass, admin : admin};
  model.add(user, (error, newuser) => {
    if(error){
      req.flash('create_user', error);
      res.redirect('/user/new');
    }
    else{
      res.redirect('/user/login');
    }
  });
});

router.get('/new', function(req, res) {
  var message = req.flash('create_user') || '';
  res.render('create_user', {
    message: message
  });
});

router.get('/profile', (req, res) => {
  // Grab the session if the user is logged in.
  var user = req.session.user;

  // Redirects user to login if they are not logged in
  if (!user) {
    req.flash('login', 'You must be logged in to access your profile');
    res.redirect('/user/login');
  }
  else{
    var message = req.flash('profile') || '';

    var courses, credits;

    course_helper.listUserCourses(user.name, (error, result) => {
      if(error){
        req.flash('courses', error);
      }
      courses = result;
    var credits=0;
    if(courses != undefined){
      for(var i=0;i<courses.length;i++){
        credits = credits + courses[i].credits;
      }
    }
    major_helper.getMajors( (err, majors) =>{
      if(err){
        message = err;
      }
        res.render('profile', {
          admin:user.admin,
          user:user,
          name: user.name,
          message: message,
          courses: courses,
          credits: credits,
          majors: majors
        });
      });
    });
  }
});

router.post('/profile/change', (req, res) => {
  var old = req.body.old;
  var newp = req.body.newp;
  var confirm = req.body.confirm;
  var user = req.session.user;
  if(old !== user.pass){
    req.flash('profile', 'Incorrect old password entered');
  }
  else if(newp !== confirm){
    req.flash('profile', 'passwords do not match');
  }
  //var user = {name : name, pass : pass, admin : admin};
  //model.add(user, (error, newuser) => {
  //  if(error){
  //    console.log("ERROR");
  //  }
  //});
else{
  model.changePassword(user, newp, (err) => {
    if(err){
      req.flash('profile', err);
    }
  });
  user.pass=newp;
  req.flash('profile' ,'Password Updated!');
}
res.redirect('/user/profile');
});

router.get('/profile/delete', (req, res) => {
  var user = req.session.user;

  // If no session, redirect to login.
  if (!user) {
    req.flash('login', 'Not logged in');
    res.redirect('/user/login');
  }
  else{
    var message = req.flash('delete_user') || '';
    res.render('delete_user',{user:user,name: user.name, message: message});
  }
});

router.post('/profile/delete/deny', (req, res) => {
  res.redirect('/user/profile');
});

router.post('/profile/delete/confirm', (req, res) => {
  var user = req.session.user;
  if(req.body.pass !== user.pass){
    req.flash('delete_user', 'Cannot delete unless password is correct');
    res.redirect('/user/profile/delete');
  }
  else{
    model.removeUser(user.name, (err)=>{
      if (err){
        req.flash('delete_user',err);
        res.redirect('/user/profile/delete');
      }
      else{
        delete req.session.user;
        req.flash('login', 'User successfully deleted');
        res.redirect('/user/login');
      }
    });
  }
});


// Performs logout functionality - it does nothing!
router.get('/logout', function(req, res) {
  // Grab the user session if logged in.
  var user = req.session.user;

  // If the client has a session, but is not online it
  // could mean that the server restarted, so we require
  // a subsequent login.
  if (user) {
    delete req.session.user;
  }

  // Redirect to login regardless.
  res.redirect('/user/login');
});

// Renders the main user view.
router.get('/main', function(req, res) {
  // Grab the user session if it exists:
  var user = req.session.user;

  // If no session, redirect to login.
  if (!user) {
    req.flash('login', 'Not logged in');
    res.redirect('/user/login');
  }
  else {
    // capture the user object or create a default.
    var message = req.flash('main') || 'Login Successful';
    res.redirect('/user/profile');
  }
});



module.exports = router;
