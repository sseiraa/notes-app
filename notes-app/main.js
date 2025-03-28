import { notesData } from "./notesData.js";

//Header
class AppHeader extends HTMLElement {
    connectedCallback() {
    this.innerHTML = `
        <header class="app-header">
            <h2>Notes App</h2>
            <div class="header-buttons">
                <button class="head-button" id="oldNotesBtn">Old Notes</button>
                <button class="head-button" id="latestNotesBtn">Latest Notes</button>
            </div>
        </header>`;

    this.querySelector("#oldNotesBtn").addEventListener("click", () => this.sortNotes("old"));
    this.querySelector("#latestNotesBtn").addEventListener("click", () => this.sortNotes("latest"));
    }

    sortNotes(order) {
    const noteGrid = document.querySelector("note-grid");
    if (noteGrid) {
        noteGrid.sortNotes(order);

      //Filter note
        this.querySelector("#oldNotesBtn").classList.toggle("active", order === "old");
      this.querySelector("#latestNotesBtn").classList.toggle("active", order === "latest");
    }
  }
}

customElements.define("app-header", AppHeader);

//search
class SearchNote extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <div class="search-container">
          <input id="searchBookTitle" type="text" placeholder="Search title note" />
          <button id="searchSubmit">Search</button>
        </div>
      `;
  
      // Event untuk pencarian
      this.querySelector("#searchSubmit").addEventListener("click", () => this.searchNotes());
      this.querySelector("#searchBookTitle").addEventListener("input", () => this.searchNotes());
    }
  
    searchNotes() {
      const query = this.querySelector("#searchBookTitle").value.toLowerCase();
      const noteGrid = document.querySelector("note-grid");
  
      if (noteGrid) {
        noteGrid.filterNotes(query);
      }
    }
  }
  
  customElements.define("search-note", SearchNote);
  
//Note item
class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const id = this.getAttribute("data-id");
    const title = this.getAttribute("data-title");
    const body = this.getAttribute("data-body");
    const createdAt = this.getAttribute("data-createdAt");
    const archived = this.getAttribute("data-archived") === "true";

    this.shadowRoot.innerHTML = `
      <style>
      .note-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr); /* 3 items per row by default */
          gap: 20px;
          margin-top: 1.5rem;
          background: linear-gradient(to right, #d0e5ff, #fff9f0);
          padding: 20px;
      }

      .note-item {
          background: linear-gradient(to right, #f7f2eb, #bad0e7);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease-in-out;
          border-radius: 10px;
          padding: 1.5rem;
          box-sizing: border-box; /* Ensures padding doesn't affect width */
      }

      .note-item:hover {
          transform: scale(1.02);
      }

      .note-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
      }

      .edit-btn, .delete-btn {
          background-color: #7096d1;
          color: #ffffff;
          padding: 8px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
      }

      .edit-btn:hover {
          background-color: #334eac;
      }

      .delete-btn:hover {
          background-color: #4c68c0;
      }

      .created-at {
          font-size: 0.8em;
          color: #999;
          margin-top: 5px;
      }

      /* Responsive adjustments */
      @media (max-width: 992px) {
          .note-grid {
              grid-template-columns: repeat(2, 1fr); /* 2 items per row for medium screens */
          }
      }

      @media (max-width: 600px) {
          .note-grid {
              grid-template-columns: 1fr; /* 1 item per row for small screens */
          }
      }

        </style>
        <div class="note-item">
            <h3>${title}</h3>
            <p>${body}</p>
            <div class="created-at">Created: ${new Date(createdAt).toLocaleString()}</div>
            <div class="note-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
            <div class="edit-form" style="display: none;">
                <input type="text" class="edit-title" value="${title}" />
                <textarea class="edit-body">${body}</textarea>
                <button class="save-edit-btn">Save</button>
            </div>
        </div>
    `;

    //event edit
    this.shadowRoot.querySelector(".edit-btn").addEventListener("click", () => this.showEditForm());
    this.shadowRoot.querySelector(".save-edit-btn").addEventListener("click", () => this.saveEdit(id));
    this.shadowRoot.querySelector(".delete-btn").addEventListener("click", () => this.deleteNote(id));
  }

  showEditForm() {
    const editForm = this.shadowRoot.querySelector(".edit-form");
    editForm.style.display = editForm.style.display === "none" ? "block" : "none";
  }

  saveEdit(id) {
    const newTitle = this.shadowRoot.querySelector(".edit-title").value;
    const newBody = this.shadowRoot.querySelector(".edit-body").value;

    if (!newTitle.trim() || !newBody.trim()) {
      alert("Title and Body cannot be empty!");
      return;
    }

    const note = notesData.find(note => note.id === id);
    if (note) {
      note.title = newTitle;
      note.body = newBody;
      document.querySelector("note-grid").render();
    }
  }

  deleteNote(id) {
    const index = notesData.findIndex(note => note.id === id);
    if (index !== -1) {
      notesData.splice(index, 1);
      document.querySelector("note-grid").render();
    }
  }
}

customElements.define("note-item", NoteItem);

//Note grid
class NoteGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<div id="grid"></div>`;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const grid = this.shadowRoot.getElementById("grid");
    grid.innerHTML = "";

    notesData.forEach(note => {
      const noteElement = document.createElement("note-item");
      noteElement.setAttribute("data-id", note.id);
      noteElement.setAttribute("data-title", note.title);
      noteElement.setAttribute("data-body", note.body);
      noteElement.setAttribute("data-createdAt", note.createdAt);
      noteElement.setAttribute("data-archived", note.archived);
      grid.appendChild(noteElement);
    });
  }

  //filter search
  filterNotes(query) {
    const grid = this.shadowRoot.getElementById("grid");
    grid.innerHTML = ""; 

    // Filter data berdasarkan query
    const filteredNotes = notesData.filter(note =>
        note.title.toLowerCase().includes(query)
    );

    // Render hasil filter
    filteredNotes.forEach(note => {
        const noteElement = document.createElement("note-item");
        noteElement.setAttribute("data-id", note.id);
        noteElement.setAttribute("data-title", note.title);
        noteElement.setAttribute("data-body", note.body);
        noteElement.setAttribute("data-createdAt", note.createdAt);
        noteElement.setAttribute("data-archived", note.archived);
        grid.appendChild(noteElement);
    });
}

  //kategori sort note
  sortNotes(order) {
    notesData.sort((a, b) => {
      if (order === "old") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    this.render();
  }
}

customElements.define("note-grid", NoteGrid);

//logic
document.addEventListener("DOMContentLoaded", () => {
  const noteTitle = document.getElementById("note-title");
  const noteBody = document.getElementById("note-body");
  const addNoteBtn = document.getElementById("add-note-btn");
  const noteGrid = document.querySelector("note-grid");

  //validasi form add
  const validateForm = () => {
    addNoteBtn.disabled = !noteTitle.value.trim() || !noteBody.value.trim();
  };

  noteTitle.addEventListener("input", validateForm);
  noteBody.addEventListener("input", validateForm);

  addNoteBtn.addEventListener("click", () => {
    if (!noteTitle.value.trim() || !noteBody.value.trim()) {
      alert("Title and Body cannot be empty!");
      return;
    }

    const newNote = {
      id: `note-${Date.now()}`,
      title: noteTitle.value,
      body: noteBody.value,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    notesData.push(newNote);
    noteGrid.render();

    noteTitle.value = "";
    noteBody.value = "";
    validateForm();
  });

  noteGrid.render();
});
