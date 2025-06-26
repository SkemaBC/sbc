const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('show');
});

document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  const closeBtn = document.querySelector(".close-btn");

  // Klik gambar dokumentasi
  document.querySelectorAll(".item-dokumentasi img").forEach(img => {
    img.addEventListener("click", () => {
      popup.style.display = "flex";
      popupImg.src = img.src;
      popupImg.alt = img.alt;
    });
  });

  // Tutup popup saat klik tombol
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    popupImg.src = "";
  });
});
