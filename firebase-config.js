import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBt_M2uyAMh3XCrSJuJ-sF1cHtoA6I9YFg",
  authDomain: "web-sbc-25723.firebaseapp.com",
  projectId: "web-sbc-25723",
  storageBucket: "web-sbc-25723.firebasestorage.app",
  messagingSenderId: "851405583308",
  appId: "1:851405583308:web:1a37f09948a67bfae0e369",
  measurementId: "G-BF7F248VS2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const chatBox = document.getElementById('chat-box');
const userInfo = document.getElementById('user-info');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesList = document.getElementById('messages');

let replyTo = null;
let repliedUser = null;
let repliedText = null;
let currentUser = null;

// Login
loginBtn.addEventListener('click', () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(console.error);
});

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// Pantau login
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    chatBox.style.display = 'none';
    userInfo.innerHTML = `Login sebagai: <strong>${user.displayName}</strong>`;
    listenForMessages();
  } else {
    currentUser = null;
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    chatBox.style.display = 'none';
    userInfo.innerText = '';
    messagesList.innerHTML = '';
  }
});

document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const openChatBtn = document.getElementById('open-chat-btn');
    const loginBtn = document.getElementById('login-btn');

    openChatBtn.addEventListener('click', function() {
        chatBox.style.display = 'block';
        openChatBtn.style.display = 'none';
        loginBtn.style.display = '';
    });

    // Close chat box when clicking outside of it
    document.addEventListener('mousedown', function(event) {
        if (chatBox.style.display === 'block' && !chatBox.contains(event.target) && !openChatBtn.contains(event.target)) {
        chatBox.style.display = 'none';
        openChatBtn.style.display = '';
        loginBtn.style.display = 'none';
        }
    });

    // Sembunyikan tombol open chat jika belum login
    onAuthStateChanged(auth, user => {
        if (user) {
            openChatBtn.style.display = '';
        } else {
            openChatBtn.style.display = 'none';
        }
    });
    
    // Optional: Hide chat box and show button again when logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        chatBox.style.display = 'none';
        openChatBtn.style.display = '';
        loginBtn.style.display = 'none';
    });
});

// Kirim pesan
sendBtn.addEventListener('click', async () => {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "chats"), {
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      createdAt: serverTimestamp(),
      replyTo: replyTo || null,
      repliedText: repliedText || null,
      repliedUser: repliedUser || null, // ✅ tambahan
      edited: false
    });

  messageInput.value = '';
  replyTo = null;
  repliedText = null;
  document.getElementById('reply-preview')?.remove(); // bersihkan preview reply
});

function setReply(id, text, user) {
  replyTo = id;
  repliedText = text;
  repliedUser = user;

  let existing = document.getElementById('reply-preview');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'reply-preview';
    messageInput.insertAdjacentElement('beforebegin', existing);
  }

  existing.textContent = `Balas: ${user}: ${text}`;
}

async function editMessage(id, oldText) {
  const newText = prompt("Edit pesan:", oldText);
  if (!newText || newText === oldText) return;

  const docRef = doc(db, "chats", id);
  await updateDoc(docRef, {
    text: newText,
    edited: true
  });
}

async function deleteMessage(id) {
  const confirmDelete = confirm("Hapus pesan ini?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "chats", id));
}

function listenForMessages() {
  const q = query(collection(db, "chats"), orderBy("createdAt"));
  onSnapshot(q, snapshot => {
    messagesList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('li');

      // Tampilkan reply jika ada
      if (data.repliedText) {
        const replyDiv = document.createElement('div');
        replyDiv.id = 'reply-div';
        replyDiv.innerText = `↪️ ${data.repliedUser} : ${data.repliedText}`;
        li.appendChild(replyDiv);
      }

      // Tampilkan isi pesan
      li.innerHTML += `<strong>${data.senderName}</strong>: ${data.text}`;
      if (data.edited) li.innerHTML += ' <em style="font-size:0.7rem">(edited)</em>';

      // Tambah waktu kirim di bawah pesan
      const timeDiv = document.createElement('div');
      timeDiv.id = 'time-div';
      timeDiv.innerText = `🕐 ${formatTimestamp(data.createdAt)}`;
      li.appendChild(timeDiv);

      // Tampilkan aksi
      const actions = document.createElement('div');

      actions.innerHTML = `<button onclick="window.setReply('${docSnap.id}', \`${data.text}\`, \`${data.senderName}\`)">Balas</button>`;

      if (data.senderId === currentUser?.uid) {
        li.style.textAlign = 'right';
        actions.innerHTML += ` <button onclick="window.editMessage('${docSnap.id}', \`${data.text}\`)">Edit</button>
                               <button onclick="window.deleteMessage('${docSnap.id}')">Hapus</button>`;
      }

      li.appendChild(actions);
      messagesList.appendChild(li);
    });
  });
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleString("id-ID", {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

window.setReply = setReply;
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;