const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { isLoggedIn, checkRole } = require('../middleware/auth');

// ====================== MARK ATTENDANCE ======================

router.get('/attendance', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const classes = await Student.distinct('className');
    res.render('attendance/select', {
      user: req.session.user,
      classes,
      success: req.query.success
    });
  } catch (error) {
    res.send('Error loading classes');
  }
});

router.get('/attendance/mark', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const { className, date } = req.query;

    if (!className || !date) {
      return res.redirect('/attendance');
    }

    const students = await Student.find({ className }).sort({ rollNumber: 1 });

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');

    const existing = await Attendance.find({
      date: { $gte: start, $lte: end },
      student: { $in: students.map(s => s._id) }
    });

    const attendanceMap = {};
    existing.forEach(a => {
      attendanceMap[a.student.toString()] = a.status;
    });

    res.render('attendance/mark', {
      user: req.session.user,
      students,
      className,
      date,
      attendanceMap
    });
  } catch (error) {
    console.log(error);
    res.send('Error loading students');
  }
});

router.post('/attendance/mark', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const { date, className } = req.body;
    let presentStudents = req.body.presentStudents || [];

    if (!Array.isArray(presentStudents)) {
      presentStudents = presentStudents ? [presentStudents] : [];
    }

    const attendanceDate = new Date(date + 'T00:00:00.000Z');
    const students = await Student.find({ className });

    for (const student of students) {
      const isPresent = presentStudents.includes(student._id.toString());
      const status = isPresent ? 'Present' : 'Absent';

      await Attendance.findOneAndUpdate(
        { 
          student: student._id, 
          date: attendanceDate 
        },
        {
          student: student._id,
          date: attendanceDate,
          status: status,
          markedBy: req.session.user.id,
          ...(status === 'Present' && { messageSent: false })
        },
        { 
          upsert: true, 
          returnDocument: 'after'
        }
      );
    }

    res.redirect('/attendance?success=1');
  } catch (error) {
    console.log(error);
    res.send('Error saving attendance: ' + error.message);
  }
});

// ====================== ABSENT + WHATSAPP ======================

router.get('/absent', isLoggedIn, checkRole(['message_faculty', 'admin']), async (req, res) => {
  try {
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    const start = new Date(selectedDate + 'T00:00:00.000Z');
    const end = new Date(selectedDate + 'T23:59:59.999Z');

    const absents = await Attendance.find({
      date: { $gte: start, $lte: end },
      status: 'Absent'
    }).populate('student');

    res.render('attendance/absent', {
      user: req.session.user,
      absents,
      selectedDate
    });
  } catch (error) {
    console.log(error);
    res.send('Error loading absent students');
  }
});

router.post('/absent/mark-sent/:id', isLoggedIn, checkRole(['message_faculty', 'admin']), async (req, res) => {
  try {
    await Attendance.findByIdAndUpdate(req.params.id, { messageSent: true });
    const redirectDate = req.body.date || '';
    res.redirect('/absent?date=' + redirectDate);
  } catch (error) {
    res.send('Error updating status');
  }
});

// ====================== ATTENDANCE HISTORY ======================

router.get('/attendance/history', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const classes = await Student.distinct('className');
    res.render('attendance/history', {
      user: req.session.user,
      classes,
      records: null,
      selectedClass: '',
      selectedDate: ''
    });
  } catch (error) {
    res.send('Error loading history page');
  }
});

router.get('/attendance/history/view', isLoggedIn, checkRole(['teacher', 'admin', 'message_faculty']), async (req, res) => {
  try {
    const { className, date } = req.query;
    const classes = await Student.distinct('className');

    if (!className || !date) {
      return res.redirect('/attendance/history');
    }

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');

    const students = await Student.find({ className }).sort({ rollNumber: 1 });

    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
      student: { $in: students.map(s => s._id) }
    }).populate('student');

    const recordMap = {};
    attendanceRecords.forEach(r => {
      recordMap[r.student._id.toString()] = r;
    });

    res.render('attendance/history', {
      user: req.session.user,
      classes,
      records: students.map(student => ({
        student,
        status: recordMap[student._id.toString()] ? recordMap[student._id.toString()].status : 'Not Marked'
      })),
      selectedClass: className,
      selectedDate: date
    });
  } catch (error) {
    console.log(error);
    res.send('Error loading attendance history');
  }
});

module.exports = router;