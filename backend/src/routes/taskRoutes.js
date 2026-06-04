const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');

// ── Task Routes ─────────────────────────────────────────────
// Prefix: /tasks (đặt trong app.js)
// Tất cả routes đều cần token xác thực

router.use(authenticate); // Apply middleware cho mọi route bên dưới

router.post('/',                  TaskController.create);           // POST   /tasks
router.get('/',                   TaskController.getAll);           // GET    /tasks?type=habit
router.put('/:id',                TaskController.update);           // PUT    /tasks/:id
router.delete('/:id',             TaskController.delete);           // DELETE /tasks/:id

// ── Scoring endpoints ───────────────────────────────────────
router.post('/:id/score',            TaskController.scoreHabit);       // POST /tasks/:id/score
router.post('/:id/complete-daily',   TaskController.completeDaily);    // POST /tasks/:id/complete-daily
router.post('/:id/uncomplete-daily', TaskController.uncompleteDaily);  // POST /tasks/:id/uncomplete-daily
router.post('/:id/complete-todo',    TaskController.completeTodo);     // POST /tasks/:id/complete-todo

module.exports = router;
