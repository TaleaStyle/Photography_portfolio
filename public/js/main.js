(function () {
  // ==== DOM-Elemente ====
  const calendarDates = document.querySelector("#calendar-dates");
  const monthYear = document.getElementById("month-year");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const timeContainer = document.querySelector(".freienTermine");
  const bookingFormEl = document.getElementById("booking-form");
  const errorMessage = document.querySelector(".alert-danger");

  const shootingSelect = document.getElementById("shootingArt");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const phoneNumberInput = document.getElementById("phoneNumber");
  const messageInput = document.getElementById("message");

  // ==== Zustandsvariablen ====
  let selectedDateString = null;
  let selectedTimeString = null;
  let activeSlot = null;
  let activeDay = null;

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // ==== Kalender rendern ====
  function renderCalendar(month, year) {
    if (!calendarDates || !monthYear) return;

    calendarDates.innerHTML = '';
    monthYear.textContent = `${months[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().setHours(0, 0, 0, 0);

  // Ausgebuchte Tage aus localStorage abrufen
  let ausgebuchteTage = JSON.parse(localStorage.getItem("ausgebuchteTage")) || {};
    Array.from({ length: firstDayOfMonth }).forEach(() =>
      calendarDates.appendChild(document.createElement("div"))
    );

    for (let i = 1; i <= daysInMonth; i++) {
      const day = document.createElement("div");
      const date = new Date(year, month, i).setHours(0, 0, 0, 0);
      const formattedDate = `${String(i).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`;

      day.textContent = i;

      if (date === today) day.classList.add("current-date");
      if (date < today) day.classList.add("last-date");
      if (new Date(date).getDay() === 0) day.classList.add("holiday-date");

      const isAvailable =
        date >= today &&
        date <= new Date(today).setMonth(new Date(today).getMonth() + 2) &&
        !day.classList.contains("holiday-date");

      day.classList.add(isAvailable ? "available-date" : "unavailable-date");

        // Prüfen, ob der Tag ausgebucht ist
    if (ausgebuchteTage[formattedDate]) {
      day.classList.remove("available-date");
      day.classList.add("fully-booked-date");
    }
      calendarDates.appendChild(day);
    }
  }

  if (calendarDates) {
    calendarDates.addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("available-date")) {
        const dayNumber = parseInt(target.textContent);
        if (!dayNumber || isNaN(dayNumber)) return;

        const formattedDate = `${String(dayNumber).padStart(2, "0")}.${(currentMonth + 1).toString().padStart(2, "0")}.${currentYear}`;
        selectDate(target, formattedDate);
      }
    });
  }

  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
    });

    renderCalendar(currentMonth, currentYear);
  }

  function generateTimeSlots(slots = [{ start: 10, end: 12 }, { start: 17, end: 19 }]) {
    return slots.flatMap(slot =>
      Array.from({ length: slot.end - slot.start }, (_, i) =>
        `${slot.start + i}:00 - ${slot.start + i + 1}:00 Uhr`
      )
    );
  }

  function selectDate(day, formattedDate) {
    if (activeDay) activeDay.classList.remove("active");
    day.classList.add("active");
    activeDay = day;
    selectedDateString = formattedDate;
    createTimeSlots();
  }

  function createTimeSlots() {
    if (!timeContainer || !selectedDateString) return;
    timeContainer.innerHTML = "";

    // Gebuchte Zeiten aus localStorage abrufen
    let gebuchteZeiten = JSON.parse(localStorage.getItem("gebuchteZeiten"))?.[selectedDateString] || [];

    generateTimeSlots().forEach(timeString => {
      const timeDiv = document.createElement("div");
      timeDiv.classList.add("termin-slot");
      timeDiv.textContent = timeString;

      if (gebuchteZeiten.includes(timeString)) {
        timeDiv.classList.add("gebucht-slot");
        timeDiv.style.display = "none";
        return;
      }

      timeDiv.addEventListener("click", () => {
        if (activeSlot) activeSlot.classList.remove("active-slot");
        timeDiv.classList.add("active-slot");
        activeSlot = timeDiv;
        selectedTimeString = timeString;
      });

      timeContainer.appendChild(timeDiv);
    });
  }

  // ==== Formular-Validierung ====
  const validateShootingart = shootingart =>
    shootingart === "" ? "Bitte eine Shooting-Art auswählen!" : null;

  const validateFirstname = firstname => {
    if (firstname.length < 4) return "Der Vorname muss mindestens vier Zeichen lang sein.";
    if (!/^[a-zA-Z]/.test(firstname)) return "Der Vorname muss mit einem Buchstaben beginnen.";
    return null;
  };

  const validatelastname = lastname => {
    if (lastname.length < 4) return "Der Nachname muss mindestens vier Zeichen lang sein.";
    if (!/^[a-zA-Z]/.test(lastname)) return "Der Nachname muss mit einem Buchstaben beginnen.";
    if (!/^[a-zA-Z0-9]+$/.test(lastname)) return "Der Nachname darf nur Buchstaben und Zahlen enthalten.";
    return null;
  };

  const validatephoneNumber = phoneNumber => {
    if (phoneNumber.trim() !== phoneNumber) return "Die Telefonnummer darf weder mit einem Leerzeichen beginnen noch enden";
    if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phoneNumber))
      return "Bitte eine gültige Telefonnummer eingeben!";
    return null;
  };

  const validateEmail = email => {
    if (email.trim() !== email) return "Die E-Mail darf weder mit einem Leerzeichen beginnen noch enden";
    if (!/^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
      return "Bitte eine gültige E-Mail-Adresse eingeben.";
    return null;
  };

  if (bookingFormEl) {
    bookingFormEl.addEventListener("submit", e => {
      e.preventDefault();

      const errors = [];

      if (!selectedDateString) errors.push("Bitte ein Datum auswählen.");
      if (!selectedTimeString) errors.push("Bitte eine Uhrzeit auswählen.");

      const shootingart = shootingSelect?.value ?? "";
      const firstname = firstNameInput?.value.trim() ?? "";
      const lastname = lastNameInput?.value.trim() ?? "";
      const email = emailInput?.value.trim() ?? "";
      const phoneNumber = phoneNumberInput?.value.trim() ?? "";
      const message = messageInput?.value.trim() ?? "";

      const validations = [
        validateShootingart(shootingart),
        validateFirstname(firstname),
        validatelastname(lastname),
        validateEmail(email),
        validatephoneNumber(phoneNumber)
      ];

      validations.forEach(error => {
        if (error) errors.push(error);
      });

      if (errors.length > 0 && errorMessage) {
        errorMessage.style.display = "block";
        errorMessage.style.color = "#dc3545";
        errorMessage.innerHTML = `... Folgende Fehler sind aufgetreten:<br />
          <ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>`;
        return;
      } else if (errorMessage) {
        errorMessage.style.display = "none";
      }

      // Gebuchte Zeiten aktualisieren
      let gebuchteZeiten = JSON.parse(localStorage.getItem("gebuchteZeiten")) || {};
      if (!gebuchteZeiten[selectedDateString]) {
        gebuchteZeiten[selectedDateString] = [];
      }
      gebuchteZeiten[selectedDateString].push(selectedTimeString);
      localStorage.setItem("gebuchteZeiten", JSON.stringify(gebuchteZeiten));

          // Speichern, dass der Tag ausgebucht ist (wenn alle Zeiten gebucht sind)
    const totalSlots = generateTimeSlots();
    if (gebuchteZeiten[selectedDateString].length === totalSlots.length) {
      let ausgebuchteTage = JSON.parse(localStorage.getItem("ausgebuchteTage")) || {};
      ausgebuchteTage[selectedDateString] = true;
      localStorage.setItem("ausgebuchteTage", JSON.stringify(ausgebuchteTage));
    }

  // Weiterleiten zur Bestätigungsseite mit URL-Parametern
  const url = `confirmation.html?vorname=${encodeURIComponent(firstname)}&nachname=${encodeURIComponent(lastname)}&shooting=${encodeURIComponent(shootingart)}&date=${encodeURIComponent(selectedDateString)}&time=${encodeURIComponent(selectedTimeString)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phoneNumber)}&message=${encodeURIComponent(messageInput.value.trim())}`;
  
  window.location.href = url;
      // Zeit-Slot ausblenden
      createTimeSlots();
    });
  }

  // ==== Text-Carousel ====
  window.textCarousel = (() => {
    const carouselTrack = document.querySelector('.text-carousel-track');
    const slides = document.querySelectorAll('.text-carousel-div');
    const radioButtons = document.querySelectorAll('input[name="text-slider"]');
    if (!carouselTrack || slides.length === 0 || radioButtons.length === 0) return;

    let currentSlideIndex = 0;

    const updateSlide = (index) => {
      if (index < 0) index = slides.length - 1;
      else if (index >= slides.length) index = 0;
      const slideWidth = slides[0].offsetWidth;
      carouselTrack.style.transform = `translateX(-${index * slideWidth}px)`;
      radioButtons[index].checked = true;
      currentSlideIndex = index;
    };

    radioButtons.forEach((button, index) => {
      button.addEventListener('change', () => updateSlide(index));
    });

    updateSlide(currentSlideIndex);
    return { prevSlide: () => updateSlide(currentSlideIndex - 1), nextSlide: () => updateSlide(currentSlideIndex + 1) };
  })();

  // ==== Hamburger-Menü ====
  function setupNavToggle() {
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelector(".navbar-links");

    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => {
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", !expanded);
        navLinks.classList.toggle("show-nav");
      });
    }
  }

  const checkVisibility = () => {
    const triggerBottom = window.innerHeight * 0.9;

    document.querySelectorAll('.scroll-element').forEach(el => {
      const rect = el.getBoundingClientRect();
      el.classList.toggle(
        'visible',
        rect.top < triggerBottom && rect.bottom >= 0
      );
    });
  }

  // Event-Handler mit Debouncing
  let isScrolling;
  window.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(checkVisibility, 50);
  });

  // Initialen Check durchführen


  // ==== Header-Image-Carousel ====
  function setupCarousel() {
    const slides = document.querySelectorAll(".carousel-slide");
    const container = document.querySelector(".carousel-container");
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");
    let index = 0;

    if (!container || slides.length === 0 || !prevButton || !nextButton) return;

    const showSlide = (n) => {
      index = (n + slides.length) % slides.length;
      container.style.transform = `translateX(-${index * 100}%)`;
    };

    prevButton.addEventListener("click", () => showSlide(index - 1));
    nextButton.addEventListener("click", () => showSlide(index + 1));
    showSlide(index);
  }

  // Aufruf der Funktionen
  setupNavToggle();
  setupCarousel();
  checkVisibility();
})();
