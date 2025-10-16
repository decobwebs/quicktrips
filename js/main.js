if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
        
        // Detect updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Show update notification
                showUpdateUI();
              }
            }
          });
        });
      })
      .catch(err => console.error('SW registration failed:', err));

    // Reload when new SW activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Listen for update messages from SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'UPDATE_DETECTED') {
        console.log('Background update completed');
      }
    });
  });

  // Simple update UI
  function showUpdateUI() {
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded shadow-lg z-50 flex items-center gap-2';
    banner.innerHTML = `
      <span>📦 New updates available</span>
      <button onclick="window.location.reload()" class="bg-white text-blue-500 px-2 py-1 rounded text-sm">
        Update
      </button>
    `;
    document.body.appendChild(banner);
    
    // Auto-remove after 10s
    setTimeout(() => banner.remove(), 10000);
  }

  // Expose refresh function for development
  window.refreshCache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'FORCE_UPDATE' });
    }
  };
}




// Initialize AOS for animations
AOS.init({ duration: 800, once: true });

// Navbar mobile toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('hidden');
});

// Hero Carousel
const slidesContainer = document.getElementById('carousel-slides');
const dotsContainer = document.getElementById('carousel-dots');
const prevButton = document.getElementById('carousel-prev');
const nextButton = document.getElementById('carousel-next');
const slides = slidesContainer.querySelectorAll('.carousel-slide');
let currentIndex = 0;
const slideInterval = 5000; // 5 seconds

// Generate hero carousel dots
slides.forEach((_, index) => {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
  dot.setAttribute('tabindex', '0');
  if (index === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(index));
  dot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToSlide(index);
    }
  });
  dotsContainer.appendChild(dot);
});

const heroDots = dotsContainer.querySelectorAll('.dot');

function goToSlide(index) {
  currentIndex = (index + slides.length) % slides.length; // Handle negative index
  slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
  heroDots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
}

function nextSlide() {
  goToSlide(currentIndex + 1);
}

function prevSlide() {
  goToSlide(currentIndex - 1);
}

let heroInterval = setInterval(nextSlide, slideInterval);

// Pause hero carousel on hover
slidesContainer.addEventListener('mouseenter', () => clearInterval(heroInterval));
slidesContainer.addEventListener('mouseleave', () => heroInterval = setInterval(nextSlide, slideInterval));

// Arrow navigation
prevButton.addEventListener('click', prevSlide);
nextButton.addEventListener('click', nextSlide);
prevButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    prevSlide();
  }
});
nextButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  }
});

// Touch swipe for mobile
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Pixels for swipe detection

slidesContainer.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  clearInterval(heroInterval);
});

slidesContainer.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > swipeThreshold) {
    nextSlide();
  } else if (touchEndX - touchStartX > swipeThreshold) {
    prevSlide();
  }
  heroInterval = setInterval(nextSlide, slideInterval);
});

// Testimonial Carousel
const testimonialSlidesContainer = document.getElementById('testimonial-slides');
const testimonialDotsContainer = document.getElementById('testimonial-dots');
const testimonialSlides = testimonialSlidesContainer.querySelectorAll('.flex-shrink-0');
let testimonialIndex = 0;
const testimonialInterval = 6000; // 6 seconds

// Generate testimonial carousel dots
testimonialSlides.forEach((_, index) => {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
  dot.setAttribute('tabindex', '0');
  if (index === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToTestimonial(index));
  dot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToTestimonial(index);
    }
  });
  testimonialDotsContainer.appendChild(dot);
});

const testimonialDots = testimonialDotsContainer.querySelectorAll('.dot');

function goToTestimonial(index) {
  testimonialIndex = index;
  testimonialSlidesContainer.style.transform = `translateX(-${testimonialIndex * 100}%)`;
  testimonialDots.forEach((dot, i) => dot.classList.toggle('active', i === testimonialIndex));
}

function nextTestimonial() {
  testimonialIndex = (testimonialIndex + 1) % testimonialSlides.length;
  goToTestimonial(testimonialIndex);
}

let testimonialIntervalId = setInterval(nextTestimonial, testimonialInterval);

// Pause testimonial carousel on hover
testimonialSlidesContainer.addEventListener('mouseenter', () => clearInterval(testimonialIntervalId));
testimonialSlidesContainer.addEventListener('mouseleave', () => testimonialIntervalId = setInterval(nextTestimonial, testimonialInterval));

// Inquiry Form
document.getElementById('inquiry-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const submitType = document.activeElement.getAttribute('data-submit');

  // Check at least one service is selected
  const services = formData.getAll('services[]');
  if (services.length === 0) {
    alert('Please select at least one service');
    return;
  }

  const name = formData.get('name') || '';
  const email = formData.get('email') || '';
  const phone = formData.get('phone') || '';
  const destination = formData.get('destination') || '';
  const dates = formData.get('dates') || '';
  const requests = formData.get('requests') || '';

  const message = `Name: ${name}
Email: ${email}
Phone: ${phone}
Destination: ${destination}
Dates: ${dates}
Services: ${services.join(', ')}
Requests: ${requests}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/8155114430?text=${encodedMessage}`;
  const mailtoUrl = `mailto:cobwebb784@gmail.com?subject=Trip Inquiry&body=${encodedMessage}`;

  if (submitType === 'whatsapp') {
    window.open(whatsappUrl, '_blank');
  } else {
    window.location.href = mailtoUrl;
  }

  form.reset();
});

// FAQ Accordion
document.querySelectorAll('.faq-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const content = toggle.nextElementSibling;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !isExpanded);
    content.classList.toggle('hidden');
  });
});


// Blog Scroll Navigation
const blogContainer = document.getElementById('blog-container');
const blogPrevButton = document.getElementById('blog-prev');
const blogNextButton = document.getElementById('blog-next');

blogPrevButton.addEventListener('click', () => {
  blogContainer.scrollBy({ left: -320, behavior: 'smooth' }); // Scroll left by one card width (w-80 = 320px)
});

blogNextButton.addEventListener('click', () => {
  blogContainer.scrollBy({ left: 320, behavior: 'smooth' }); // Scroll right by one card width
});

blogPrevButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    blogContainer.scrollBy({ left: -320, behavior: 'smooth' });
  }
});

blogNextButton.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    blogContainer.scrollBy({ left: 320, behavior: 'smooth' });
  }
});