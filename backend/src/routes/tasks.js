const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getTasks, createTask, updateTask, deleteTask,
  completeTask, aiParseTask, syncTasks,
} = require('../controllers/taskController');

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.post('/ai-parse', aiParseTask);
router.post('/sync', syncTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);

module.exports = router;
