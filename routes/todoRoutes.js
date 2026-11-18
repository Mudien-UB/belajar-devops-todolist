import { Router } from 'express';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  updateTodo,
} from '../controllers/todoController.js';

const router = Router();

router.get('/', listTodos);
router.get('/:id', getTodo);
router.post('/', createTodo);
router.patch('/:id', updateTodo);
router.delete('/:id', deleteTodo);

export default router;
