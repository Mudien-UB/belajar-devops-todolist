import { prisma } from '../lib/prisma.js';
import { createTodoController } from './todoControllerFactory.js';

export { createTodoController } from './todoControllerFactory.js';

const todoController = createTodoController(prisma);

export const {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
} = todoController;
