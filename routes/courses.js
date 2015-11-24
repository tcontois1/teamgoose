var express = require('express');

var helper = require('../lib/course_helper');

var router = express.Router();

router.get('/', (req, res) => {
	var list;
    helper.list( (error, courses) => {
      list = courses;
    });

    res.render('courses', {
      courses: list,
    });
});

router.post('/add', (req, res) => {
	var dept = req.body.dept;
  var num = req.body.num;
  if(!dept || !num){

  }else{
	var course = {dept : dept, num : num};
  helper.add(course, (error, new_course) => {
    res.redirect('/courses');
  });
}
});

module.exports = router;