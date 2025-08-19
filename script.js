document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide');

    // Create navigation buttons
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '‹';
    prevButton.classList.add('slider-nav-button', 'prev');
    
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '›';
    nextButton.classList.add('slider-nav-button', 'next');

    // Insert buttons into the DOM
    const sliderWrapper = document.querySelector('.slider-wrapper');
    sliderWrapper.appendChild(prevButton);
    sliderWrapper.appendChild(nextButton);

    let currentIndex = 0;

    function goToSlide(index) {
        sliderContainer.scrollLeft = slides[index].offsetLeft;
        currentIndex = index;
    }

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
        goToSlide(currentIndex);
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
        goToSlide(currentIndex);
    });
});