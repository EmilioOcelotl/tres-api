// main.js
async function fetchTree() {
  const res = await fetch('/api/3d/structure');
  const json = await res.json();
  if (!json.success) throw new Error('Error al obtener estructura');
  return json.data;
}

async function fetchNoteContent(noteId) {
  const res = await fetch(`/api/3d/note/${noteId}/content`);
  const json = await res.json();
  if (!json.success) throw new Error('Error al obtener contenido de la nota');
  return json.data;
}

function createTreeNode(node) {
  const li = document.createElement('li');
  li.textContent = node.title;
  li.dataset.noteId = node.id;

  li.style.cursor = 'pointer';
  li.style.margin = '4px 0';

  li.addEventListener('click', async (e) => {
    e.stopPropagation(); // evitar que colapsen padres
    const content = await fetchNoteContent(node.id);
    displayNoteContent(content);
  });

  if (node.children && node.children.length > 0) {
    const ul = document.createElement('ul');
    ul.style.paddingLeft = '20px';
    node.children.forEach(child => {
      ul.appendChild(createTreeNode(child));
    });
    li.appendChild(ul);
  }

  return li;
}

function displayNoteContent(note) {
  const titleEl = document.getElementById('note-title');
  const contentEl = document.getElementById('note-content');

  titleEl.textContent = note.title;
  contentEl.textContent = note.content;
}

async function init() {
  try {
    const tree = await fetchTree();
    const rootUl = document.getElementById('tree-root');
    rootUl.innerHTML = ''; // limpiar
    rootUl.appendChild(createTreeNode(tree));
  } catch (err) {
    console.error(err);
    const rootUl = document.getElementById('tree-root');
    rootUl.innerHTML = '<li>Error al cargar las notas.</li>';
  }
}

init();
