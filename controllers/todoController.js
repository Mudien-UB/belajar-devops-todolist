import { prisma } from '../lib/prisma.js';

const MAX_TITLE_LENGTH = 255;

function parseTodoId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateTodoInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const allowedFields = partial ? ['title', 'isDone'] : ['title'];
  const unexpectedField = Object.keys(body).find((key) => !allowedFields.includes(key));
  if (unexpectedField) return { error: `Unexpected field: ${unexpectedField}.` };
  if (partial && Object.keys(body).length === 0) return { error: 'Provide at least one field to update.' };

  const data = {};
  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string') return { error: 'title must be a string.' };

    const title = body.title.trim();
    if (!title) return { error: 'title cannot be empty.' };
    if (title.length > MAX_TITLE_LENGTH) return { error: `title must be at most ${MAX_TITLE_LENGTH} characters.` };
    data.title = title;
  } else if (!partial) {
    return { error: 'title is required.' };
  }

  if (Object.hasOwn(body, 'isDone')) {
    if (typeof body.isDone !== 'boolean') return { error: 'isDone must be a boolean.' };
    data.isDone = body.isDone;
  }

  return { data };
}

function getValidId(req, res) {
  const id = parseTodoId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'id must be a positive integer.' });
    return null;
  }
  return id;
}

export function createTodoController(database) {
  return {
    async listTodos(req, res) {
      const todos = await database.todo.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json({ data: todos });
    },

    async getTodo(req, res) {
      const id = getValidId(req, res);
      if (!id) return;

      const todo = await database.todo.findUnique({ where: { id } });
      if (!todo) return res.status(404).json({ error: 'Todo not found.' });
      return res.status(200).json({ data: todo });
    },

    async createTodo(req, res) {
      const validation = validateTodoInput(req.body);
      if (validation.error) return res.status(400).json({ error: validation.error });

      const todo = await database.todo.create({ data: validation.data });
      return res.status(201).json({ data: todo });
    },

    async updateTodo(req, res) {
      const id = getValidId(req, res);
      if (!id) return;

      const validation = validateTodoInput(req.body, { partial: true });
      if (validation.error) return res.status(400).json({ error: validation.error });

      const existingTodo = await database.todo.findUnique({ where: { id } });
      if (!existingTodo) return res.status(404).json({ error: 'Todo not found.' });

      const todo = await database.todo.update({ where: { id }, data: validation.data });
      return res.status(200).json({ data: todo });
    },

    async deleteTodo(req, res) {
      const id = getValidId(req, res);
      if (!id) return;

      const existingTodo = await database.todo.findUnique({ where: { id } });
      if (!existingTodo) return res.status(404).json({ error: 'Todo not found.' });

      await database.todo.delete({ where: { id } });
      return res.status(204).send();
    },
  };
}

const todoController = createTodoController(prisma);

export const {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
} = todoController;
