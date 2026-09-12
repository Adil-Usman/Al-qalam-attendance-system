const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// Parents search page
router.get('/parents', (req, res) => {
  res.render('parents/search', {
    error: null,
    student: null,
    records: null
  });
});

// Handle search
router.post('/parents/search', async (req, res) => {
  try {
    const { rollNumber, className } = req.body;

    const student = await Student.findOne({ 
      rollNumber: rollNumber.trim(), 
      className: className.trim() 
    });

    if (!student) {
      return res.render('parents/search', {
        error: 'Student not found. Please check Roll Number and Class.',
        student: null,
        records: null
      });
    }

    // Get last 7 working days (skip Sunday)
    const records = [];
    let current = new Date();
    let collected = 0;

    while (collected < 7) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (dayOfWeek !== 0) { // Skip Sunday
        const dateStr = current.toISOString().split('T')[0];
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });

        const start = new Date(dateStr + 'T00:00:00.000Z');
        const end = new Date(dateStr + 'T23:59:59.999Z');

        const record = await Attendance.findOne({
          student: student._id,
          date: { $gte: start, $lte: end }
        });

        records.push({
          date: dateStr,
          day: dayName,
          status: record ? record.status : 'Not Marked'
        });

        collected++;
      }

      // Go to previous day
      current.setDate(current.getDate() - 1);
    }

    res.render('parents/search', {
      error: null,
      student,
      records
    });

  } catch (error) {
    console.log(error);
    res.render('parents/search', {
      error: 'Something went wrong. Please try again.',
      student: null,
      records: null
    });
  }
});

module.exports = router;