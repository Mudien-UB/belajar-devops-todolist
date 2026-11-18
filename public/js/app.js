const form = document.querySelector('#todo-form');
const titleInput = document.querySelector('#todo-title');
const todoList = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const summary = document.querySelector('#task-summary');
const message = document.querySelector('#message');
const submitButton = form.querySelector('button');

function setMessage(text = '') {
  message.textContent = text;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error || 'Something went wrong.');
  return payload?.data;
}

function render(todos) {
  todoList.replaceChildren();
  emptyState.hidden = todos.length > 0;
  const remaining = todos.filter((todo) => !todo.isDone).length;
  summary.textContent = todos.length === 0 ? 'A clear list is a calm mind.' : `${remaining} task${remaining === 1 ? '' : 's'} remaining`;

  for (const todo of todos) {
    const item = document.createElement('li');
    item.className = `todo-item${todo.isDone ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.isDone;
    checkbox.setAttribute('aria-label', `Mark ${todo.title} as ${todo.isDone ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => updateTodo(todo.id, { isDone: checkbox.checked }));

    const text = document.createElement('span');
    text.className = 'todo-title';
    text.textContent = todo.title;

    const remove = document.createElement('button');
    remove.className = 'delete-button';
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => deleteTodo(todo.id));

    item.append(checkbox, text, remove);
    todoList.append(item);
  }
}

async function loadTodos() {
  try {
    setMessage();
    render(await request('/todos'));
  } catch (error) {
    summary.textContent = 'Unable to load tasks';
    setMessage(error.message);
  }
}

async function updateTodo(id, data) {
  try {
    setMessage();
    await request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await loadTodos();
  } catch (error) {
    setMessage(error.message);
    await loadTodos();
  }
}

async function deleteTodo(id) {
  try {
    setMessage();
    await request(`/todos/${id}`, { method: 'DELETE' });
    await loadTodos();
  } catch (error) {
    setMessage(error.message);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  try {
    setMessage();
    await request('/todos', { method: 'POST', body: JSON.stringify({ title: titleInput.value }) });
    form.reset();
    await loadTodos();
    titleInput.focus();
  } catch (error) {
    setMessage(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

loadTodos();
