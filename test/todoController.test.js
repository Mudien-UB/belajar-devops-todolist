import assert from 'node:assert/strict';
import test from 'node:test';
import { createTodoController } from '../controllers/todoController.js';

function createResponse() {
  return {
    statusCode: null,
    body: null,
    sent: false,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send() { this.sent = true; return this; },
  };
}

function createDatabase(overrides = {}) {
  return {
    todo: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 1, isDone: false, ...data }),
      update: async ({ where, data }) => ({ id: where.id, title: 'Existing task', isDone: false, ...data }),
      delete: async () => undefined,
      ...overrides,
    },
  };
}

test('lists todos ordered by newest first', async () => {
  const todos = [{ id: 2, title: 'Newer' }];
  let options;
  const controller = createTodoController(createDatabase({
    findMany: async (value) => { options = value; return todos; },
  }));
  const res = createResponse();

  await controller.listTodos({}, res);

  assert.deepEqual(options, { orderBy: { createdAt: 'desc' } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { data: todos });
});

test('creates a trimmed todo title', async () => {
  let receivedData;
  const controller = createTodoController(createDatabase({
    create: async ({ data }) => { receivedData = data; return { id: 1, ...data, isDone: false }; },
  }));
  const res = createResponse();

  await controller.createTodo({ body: { title: '  Buy milk  ' } }, res);

  assert.deepEqual(receivedData, { title: 'Buy milk' });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.title, 'Buy milk');
});

test('rejects invalid todo creation input', async () => {
  const controller = createTodoController(createDatabase());
  const res = createResponse();

  await controller.createTodo({ body: { title: '' } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'title cannot be empty.' });
});

test('rejects an invalid todo id', async () => {
  const controller = createTodoController(createDatabase());
  const res = createResponse();

  await controller.getTodo({ params: { id: 'zero' } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'id must be a positive integer.' });
});

test('returns 404 when a todo does not exist', async () => {
  const controller = createTodoController(createDatabase());
  const res = createResponse();

  await controller.getTodo({ params: { id: '10' } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Todo not found.' });
});

test('updates a todo completion state', async () => {
  let updateArguments;
  const controller = createTodoController(createDatabase({
    findUnique: async () => ({ id: 5, title: 'Existing task', isDone: false }),
    update: async (args) => { updateArguments = args; return { id: 5, title: 'Existing task', isDone: true }; },
  }));
  const res = createResponse();

  await controller.updateTodo({ params: { id: '5' }, body: { isDone: true } }, res);

  assert.deepEqual(updateArguments, { where: { id: 5 }, data: { isDone: true } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.isDone, true);
});

test('rejects updates without permitted fields', async () => {
  const controller = createTodoController(createDatabase());
  const res = createResponse();

  await controller.updateTodo({ params: { id: '5' }, body: { completed: true } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Unexpected field: completed.' });
});

test('deletes an existing todo', async () => {
  let deletedWhere;
  const controller = createTodoController(createDatabase({
    findUnique: async () => ({ id: 3, title: 'Remove me', isDone: false }),
    delete: async ({ where }) => { deletedWhere = where; },
  }));
  const res = createResponse();

  await controller.deleteTodo({ params: { id: '3' } }, res);

  assert.deepEqual(deletedWhere, { id: 3 });
  assert.equal(res.statusCode, 204);
  assert.equal(res.sent, true);
});
