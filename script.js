const API_URL = "http://localhost:3000"; // Replace with your backend URL

let quill;
let editingNoteId = null;

const token = localStorage.getItem("token");
const authSection = document.getElementById("auth-section");
const notesSection = document.getElementById("notes-section");
const submitButton = document.getElementById("submitButton");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const editButtons = document.getElementById("editButtons");

if (token) {
  loadNotes();
  authSection.classList.add("d-none");
  notesSection.classList.remove("d-none");
} else {
  authSection.classList.remove("d-none");
  notesSection.classList.add("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  quill = new Quill("#editor", {
    theme: "snow",
    placeholder: "Write your note here...",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["image", "link"],
        [{ align: [] }],
        [{ header: [1, 2, 3, false] }],
      ],
    },
  });
});

// Login/Register Toggle
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").classList.add("d-none");
  document.getElementById("register-form").classList.remove("d-none");
});

document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").classList.add("d-none");
  document.getElementById("login-form").classList.remove("d-none");
});

// Register User
document.getElementById("registerButton").addEventListener("click", async () => {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      alert("Registration successful! Please log in.");
      document.getElementById("show-login").click();
    } else {
      const { error } = await res.json();
      alert(error);
    }
  } catch (err) {
    console.error("Registration error:", err);
  }
});

// Login User
document.getElementById("loginButton").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("token", token);
      loadNotes();
      authSection.classList.add("d-none");
      notesSection.classList.remove("d-none");
    } else {
      const { error } = await res.json();
      alert(error);
    }
  } catch (err) {
    console.error("Login error:", err);
  }
});

// Load Notes
async function loadNotes() {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { notes } = await res.json();
      notesList.innerHTML = notes
        .map(
          (note) => `
          <div id="note-${note.id}" class="note">
            <h5>${note.title}</h5>
            <div class="note-content">${note.content}</div>
            <p class="note-timestamp">Last edited: ${getTimeAgo(note.updated_at)}</p>
            <div class="note-actions">
              <button class="btn btn-warning btn-sm" onclick="editNoteById(${note.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteNoteById(${note.id})">Delete</button>
            </div>
          </div>`
        )
        .join("");
    }
  } catch (err) {
    console.error("Error loading notes:", err);
  }
}

// Add Note
submitButton.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  const title = document.getElementById("noteTitle").value;
  const content = quill.root.innerHTML;

  try {
    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      loadNotes();
      quill.root.innerHTML = "";
      document.getElementById("noteTitle").value = "";
    }
  } catch (err) {
    console.error("Error adding note:", err);
  }
});

// Edit Note by ID
function editNoteById(id) {
  editingNoteId = id;
  const noteElement = document.getElementById(`note-${id}`);
  const title = noteElement.querySelector("h5").innerText;
  const content = noteElement.querySelector(".note-content").innerHTML;

  document.getElementById("noteTitle").value = title;
  quill.root.innerHTML = content;

  submitButton.classList.add("d-none");
  editButtons.classList.remove("d-none");
}

saveButton.addEventListener("click", async () => {
  if (!editingNoteId) return;
  const token = localStorage.getItem("token");
  const title = document.getElementById("noteTitle").value;
  const content = quill.root.innerHTML;

  try {
    const res = await fetch(`${API_URL}/notes/${editingNoteId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      loadNotes();
      cancelEdit();
    }
  } catch (err) {
    console.error("Error updating note:", err);
  }
});

cancelButton.addEventListener("click", () => {
  cancelEdit();
});

function cancelEdit() {
  editingNoteId = null;
  document.getElementById("noteTitle").value = "";
  quill.root.innerHTML = "";
  submitButton.classList.remove("d-none");
  editButtons.classList.add("d-none");
}

// Delete Note by ID
async function deleteNoteById(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const noteElement = document.getElementById(`note-${id}`);
      if (noteElement) {
        noteElement.remove();
      }
    }
  } catch (err) {
    console.error("Error deleting note:", err);
  }
}

// Helper: Get Time Ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const updatedAt = new Date(timestamp);
  const seconds = Math.floor((now - updatedAt) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const body = document.body;
  body.classList.toggle("dark-theme");
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.innerText = body.classList.contains("dark-theme")
    ? "Switch to Light Mode"
    : "Switch to Dark Mode";
});
