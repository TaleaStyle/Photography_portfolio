(function () {
    // DOM-Elemente
    const calendarDates = document.querySelector("#calendar-dates");
    const monthYear = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeContainer = document.querySelector('.freienTermine');
    const bookingFormEl = document.getElementById("booking-form");
    const errorMessage = document.querySelector('.alert-danger');
    
    const shootingSelect = document.getElementById("shootingArt");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const phoneNumberInput = document.getElementById("phoneNumber");
    const messageInput  =document.getElementById("message");
      
    // Zustandsvariablen

    let selectedDateString = null;
    let selectedTimeString = null;
    let activeSlot = null;
    let activeDay = null; // Speichert den aktuell ausgewählten Tag

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    const months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    
    
        // ===== Kalender rendern =====
        function renderCalendar(month, year) {
            // Kalender-Container leeren
            calendarDates.innerHTML = '';
            // Aktuellen Monat und Jahr anzeigen
            monthYear.textContent = `${months[month]} ${year}`;
    
            // Berechnen des ersten Wochentags des Monats und der Anzahl der Tage
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date().setHours(0, 0, 0, 0); // Heutiges Datum ohne Uhrzeit
    
            // Leere Felder für die Tage vor dem 1. des Monats einfügen
            Array.from({ length: firstDayOfMonth }).forEach(() =>
                calendarDates.appendChild(document.createElement('div'))
            );
    
            // Tage des Monats erstellen und einfügen
            for (let i = 1; i <= daysInMonth; i++) {
                const day = document.createElement('div');
                const date = new Date(year, month, i).setHours(0, 0, 0, 0);
    
                day.textContent = i;
                // Klassen für verschiedene Tageszustände hinzufügen
                if (date === today) day.classList.add('current-date');
                if (date < today) day.classList.add('last-date');
                if (new Date(date).getDay() === 0) day.classList.add('holiday-date');
    
                // Überprüfen, ob der Tag verfügbar ist
                let isAvailable = date >= today && date <= new Date(today).setMonth(new Date(today).getMonth() + 2)
                    && !day.classList.contains('holiday-date');
    
                if (isAvailable) {
                    day.classList.add('available-date');
                } else {
                    day.classList.add('unavailable-date');
                }
                
                calendarDates.appendChild(day);
            }
    
            // Event-Listener für Klicks auf Kalendertage
            
        }

        calendarDates.addEventListener("click", (event) => {
          const target = event.target;
          if (target.classList.contains('available-date')) {
              const day = target;
              const dayNumber = parseInt(day.textContent);
              if (!dayNumber || isNaN(dayNumber)) return;
              
              const formattedDate = `${String(dayNumber).padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
              
              selectDate(day, formattedDate);
              
          }
      });
      if (prevMonthBtn && nextMonthBtn && calendarDates && monthYear) {
        // Monatsnavigation nur aktivieren, wenn alles vorhanden ist
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        });
      
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        });
      
        renderCalendar(currentMonth, currentYear);
      }
      
    
          // === GenerateTimeSlots ===

    function generateTimeSlots(slots = [{ start: 10, end: 12 }, { start: 17, end: 19 }]) {
        const slotsArray = [];
      
        slots.forEach(slot => {
          for (let i = slot.start; i < slot.end; i++) {
            slotsArray.push(`${i}:00 - ${i + 1}:00 Uhr`);
          }
        });
      
        return slotsArray;
      }

     // ========Funktion zum Auswählen eines Datums
     function selectDate(day, formattedDate) {
        if (activeDay) {
            activeDay.classList.remove('active'); // Aktive Klasse vom vorherigen Tag entfernen
        }
        day.classList.add('active'); // Aktive Klasse zum neuen Tag hinzufügen
        activeDay = day; // Aktiven Tag aktualisieren
        selectedDateString = formattedDate; // Speichern für spätere Verwendung
        console.log(`Ausgewähltes Datum: ${formattedDate}`); // Datum in der Konsole ausgeben
        createTimeSlots(() => {}); // Slots anzeigen beim Datumsklick
    }

     //======= normalizeDateString

    function normalizeDateString(dateString) {
        const [day, month, year] = dateString.split(".");
        return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
      }
      
      async function createTimeSlots(onSlotClick) {
        timeContainer.innerHTML = '';
        
        if (!selectedDateString) return;
      
        // 🟡 Schritt 1: Hole alle gebuchten Termine
        let gebuchteZeiten = [];
        try {
          const res = await fetch("/api/termine");
          const termine = await res.json();
          gebuchteZeiten = termine
  .filter(t => normalizeDateString(t.datum) === selectedDateString)
  .map(t => t.uhrzeit);

        } catch (err) {
          console.error("Fehler beim Laden gebuchter Termine:", err);
        }
      
        // 🟡 Schritt 2: Alle möglichen Slots erzeugen
        const totalSlots = generateTimeSlots(); // z. B. ["10:00 - 11:00 Uhr", ...]
      
        totalSlots.forEach(timeString => {
          const timeDiv = document.createElement('div');
          timeDiv.classList.add('termin-slot');
          timeDiv.textContent = timeString;
          timeDiv.dataset.time = timeString;
      
          //  Slot ist bereits gebucht? → nicht anzeigen
          if (gebuchteZeiten.includes(timeString)) {
            timeDiv.classList.add('gebucht-slot'); // für Style optional
            timeDiv.style.display = 'none'; // direkt verstecken
            return; // skip
          }
      
          // ✅ Slot ist frei → klickbar
          timeDiv.addEventListener("click", () => {
            if (activeSlot) activeSlot.classList.remove('active-slot');
            timeDiv.classList.add('active-slot');
            activeSlot = timeDiv;
            selectedTimeString = timeString;
            console.log(`Ausgewählter Slot: ${selectedTimeString} am ${selectedDateString}`);
            onSlotClick(timeDiv, timeString);
          });
      
          timeContainer.appendChild(timeDiv);
        });
      }
      
    
    // ===== FUNCTIONS Formular validieren =====
    
    const validateShootingart = (shootingart) => {
      if (shootingart === "") {
          return 'Bitte eine Shooting-Art auswählen!';
      }
      return null;
    };
    
    const validateFirstname = (firstname) => {
      if (firstname.length < 4) {
          return 'Der Vorname muss mindestens vier Zeichen lang sein.';
      }
      
      const startWithLetter = /^[a-zA-Z]/;
      if (!startWithLetter.test(firstname)) {
          return 'Der Vorname muss mit einem Buchstaben beginnen.';
      }
      
      return null;
    };
    
    const validatelastname = (lastname) => {
     if (lastname.length < 4) {
         return 'Der Nachname muss mindestens vier Zeichen lang sein.';
     }
    
     const startWithLetter = /^[a-zA-Z]/;
     if (!startWithLetter.test(lastname)) {
         return 'Der Nachname muss mit einem Buchstaben beginnen.';
     }
    
     const hasLettersAndDigits = /^[a-zA-Z0-9]+$/;
     if (!hasLettersAndDigits.test(lastname)) {
         return 'Der Nachname darf nur Buchstaben und Zahlen enthalten.';
     }
    
     return null;
    };
    
    const validatephoneNumber= (phoneNumber) => {
     if (phoneNumber.trim() !== phoneNumber) {
         return 'Die Telefonnummer darf weder mit einem Leerzeichen beginnen noch enden';
     }
    
     const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
     if (!phonePattern.test(phoneNumber)) {
         return 'Bitte eine gültige Telefonnummer eingeben!';
     }
    
     return null;
    };
    
    const validateEmail = (email) => {
     if (email.trim() !== email) {
         return 'Die E-Mail darf weder mit einem Leerzeichen beginnen noch enden';
     }
    
     const emailPattern = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
     if (!emailPattern.test(email)) {
         return 'Bitte eine gültige E-Mail-Adresse eingeben.';
     }
    
     return null;
    };
    
      // Kalender initialisieren
      renderCalendar(currentMonth, currentYear);
    
  
      bookingFormEl.addEventListener('submit',  (e) => {
        e.preventDefault(); // Standardverhalten unterbinden
        
        const errors = [];
      
        if (!selectedDateString) {
          errors.push("Bitte ein Datum auswählen.");
      }
      if (!selectedTimeString) {
          errors.push("Bitte eine Uhrzeit auswählen.");
      }
      
        // ===== Shooting-Art Validation =====
        const shootingart = shootingSelect.value;
        const shootingError = validateShootingart(shootingart);
        if (shootingError) errors.push(shootingError);   
      
        // ===== Firstname Validation =====
        const firstname = firstNameInput.value.trim();
        const firstnameError = validateFirstname(firstname);
        if (firstnameError) errors.push(firstnameError);
      
        // ===== Lastname Validation =====
        const lastname = lastNameInput.value.trim();
        const lastnameError = validatelastname(lastname);
        if (lastnameError) errors.push(lastnameError);
      
        // ===== Email Validation =====
        const email = emailInput.value.trim();
        const emailError = validateEmail(email);
        if (emailError) errors.push(emailError);
      
        // ===== Phone Number Validation =====
        const phoneNumber = phoneNumberInput.value.trim();
        const phoneNumberError = validatephoneNumber(phoneNumber);
        if (phoneNumberError) errors.push(phoneNumberError);
      
           // ===== Error Handling =====
           if (errors.length > 0) {
            errorMessage.style.display = "block";
            errorMessage.style.color = "#dc3545";

            errorMessage.innerHTML = `
                Folgende Fehler sind aufgetreten:<br />
                <ul>
                    ${errors.map((error) => `<li>${error}</li>`).join('')}
                </ul>
            `;
            return;
        } else {
            errorMessage.style.display = "none";
        }
        

    // Weiterleiten zur Bestätigungsseite mit URL-Parametern
  const url = `confirmation.html?vorname=${encodeURIComponent(firstname)}&nachname=${encodeURIComponent(lastname)}&shooting=${encodeURIComponent(shootingart)}&date=${encodeURIComponent(selectedDateString)}&time=${encodeURIComponent(selectedTimeString)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phoneNumber)}&message=${encodeURIComponent(messageInput.value.trim())}`;
  
  window.location.href = url;
    
      
});



// JavaScript für das Text-Carousel
window.textCarousel = (() => {
    const carouselTrack = document.querySelector('.text-carousel-track');
    const slides = document.querySelectorAll('.text-carousel-div');
    const radioButtons = document.querySelectorAll('input[name="text-slider"]');

    if (!carouselTrack || slides.length === 0 || radioButtons.length === 0) {
        // console.warn("Carousel-Elemente nicht gefunden oder unvollständig.");
        return; // Beende die Funktion, falls essentielle Elemente fehlen
    }

    let currentSlideIndex = 0;

    // Funktion zum Wechseln der Slides
    const updateSlide = (index) => {
        // Sicherstellen, dass der Index innerhalb des gültigen Bereichs liegt
        if (index < 0) {
            index = slides.length - 1; // Gehe zum letzten Slide
        } else if (index >= slides.length) {
            index = 0; // Gehe zum ersten Slide
        }

        // Aktualisiere die Position des Tracks
        const slideWidth = slides[0].offsetWidth;
        carouselTrack.style.transform = `translateX(-${index * slideWidth}px)`;

        // Aktualisiere den aktiven Radio-Button
        radioButtons[index].checked = true;

        // Aktualisiere den aktuellen Slide-Index
        currentSlideIndex = index;
    };

    // Funktion für den vorherigen Slide
    const prevSlide = () => {
        updateSlide(currentSlideIndex - 1);
    };

    // Funktion für den nächsten Slide
    const nextSlide = () => {
        updateSlide(currentSlideIndex + 1);
    };

    // Event Listener für die Radio-Buttons
    radioButtons.forEach((button, index) => {
        button.addEventListener('change', () => {
            updateSlide(index);
        });
    });

    // Initiale Position setzen
    updateSlide(currentSlideIndex);

    return { prevSlide, nextSlide };
})();



// Hamburger-Menü Funktion
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

// Carousel Funktion
function setupCarousel() {
    const slides = document.querySelectorAll(".carousel-slide");
    const container = document.querySelector(".carousel-container");
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");
    let index = 0;

    if (!container || slides.length === 0 || !prevButton || !nextButton) return; // Sicherstellen, dass alles existiert

    function showSlide(n) {
        index = (n + slides.length) % slides.length;
        container.style.transform = `translateX(-${index * 100}%)`;
    }

    prevButton.addEventListener("click", () => showSlide(index - 1));
    nextButton.addEventListener("click", () => showSlide(index + 1));

    showSlide(index); // Starte mit Slide 0
}


       })();
     