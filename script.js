document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.slider-nav-button.prev');
    const nextButton = document.querySelector('.slider-nav-button.next');
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenuButton = document.querySelector('.close-menu');

    let currentIndex = 0;

    function goToSlide(index) {
        if (slides[index]) {
            sliderContainer.scrollLeft = slides[index].offsetLeft;
            currentIndex = index;
        }
    }

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
        goToSlide(currentIndex);
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
        goToSlide(currentIndex);
    });

    // Mobile Menu functionality
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('open');
    });

    closeMenuButton.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    });
});