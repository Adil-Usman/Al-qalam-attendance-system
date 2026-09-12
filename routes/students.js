const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { isLoggedIn, checkRole } = require('../middleware/auth');

// Show all students
router.get('/students', isLoggedIn, async (req, res) => {
  try {
    const students = await Student.find().sort({ className: 1, rollNumber: 1 });
    res.render('students/index', {
      user: req.session.user,
      students
    });
  } catch (error) {
    res.send('Error loading students');
  }
});

// Show Add Student form
router.get('/students/add', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), (req, res) => {
  res.render('students/add', { user: req.session.user });
});

// Handle Add Student
router.post('/students/add', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const { name, rollNumber, className, section, phone, parentPhone, parentName } = req.body;

    const student = new Student({
      name,
      rollNumber,
      className,
      section,
      phone,
      parentPhone,
      parentName
    });

    await student.save();
    res.redirect('/students');
  } catch (error) {
    console.log(error);
    res.send('Error adding student');
  }
});

// Show Edit form
router.get('/students/edit/:id', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    res.render('students/edit', {
      user: req.session.user,
      student
    });
  } catch (error) {
    res.send('Student not found');
  }
});

// Handle Edit Student
router.post('/students/edit/:id', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const { name, rollNumber, className, section, phone, parentPhone, parentName } = req.body;

    await Student.findByIdAndUpdate(req.params.id, {
      name,
      rollNumber,
      className,
      section,
      phone,
      parentPhone,
      parentName
    });

    res.redirect('/students');
  } catch (error) {
    res.send('Error updating student');
  }
});

// Delete Student
router.post('/students/delete/:id', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/students');
  } catch (error) {
    res.send('Error deleting student');
  }
});

module.exports = router;