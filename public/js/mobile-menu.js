// Mobile Menu functionality with ARIA and focus trap
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenuButton = document.querySelector('.close-menu');
    let lastFocusedElementBeforeMenu = null;

    console.log('📱 Mobile Menu Script cargado');
    console.log('Menu Toggle:', menuToggle);
    console.log('Mobile Menu:', mobileMenu);
    console.log('Close Button:', closeMenuButton);

    const getFocusableElements = (container) => {
        return container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    };

    const openMobileMenu = () => {
        if (!mobileMenu || !menuToggle) return;
        console.log('📱 Abriendo menú móvil');
        lastFocusedElementBeforeMenu = document.activeElement;
        mobileMenu.classList.add('open');
        menuToggle.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        const focusables = getFocusableElements(mobileMenu);
        if (focusables.length > 0) {
            focusables[0].focus();
        }
        document.addEventListener('keydown', handleKeydownInMenu);
    };

    const closeMobileMenu = () => {
        if (!mobileMenu || !menuToggle) return;
        console.log('📱 Cerrando menú móvil');
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', handleKeydownInMenu);
        if (lastFocusedElementBeforeMenu) {
            lastFocusedElementBeforeMenu.focus();
        } else {
            menuToggle.focus();
        }
    };

    const handleKeydownInMenu = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMobileMenu();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = Array.from(getFocusableElements(mobileMenu));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    if (menuToggle && mobileMenu) {
        console.log('📱 Agregando event listener al menu toggle');
        menuToggle.addEventListener('click', (e) => {
            console.log('📱 Click detectado en menu toggle!', e);
            e.preventDefault();
            e.stopPropagation();
            const isOpen = mobileMenu.classList.contains('open');
            console.log('📱 Menu está abierto?', isOpen);
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    } else {
        console.log('📱 NO se encontró menuToggle o mobileMenu', { menuToggle, mobileMenu });
    }

    if (closeMenuButton && mobileMenu) {
        closeMenuButton.addEventListener('click', (e) => {
            console.log('📱 Click en botón cerrar');
            e.preventDefault();
            e.stopPropagation();
            closeMobileMenu();
        });
    }

    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        // Mobile submenu toggle functionality
        const submenuToggles = mobileMenu.querySelectorAll('.submenu-toggle');
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const submenu = toggle.nextElementSibling;
                const isOpen = submenu.classList.contains('open');

                // Close all other submenus
                mobileMenu.querySelectorAll('.submenu').forEach(s => {
                    if (s !== submenu) {
                        s.classList.remove('open');
                    }
                });
                mobileMenu.querySelectorAll('.submenu-toggle').forEach(t => {
                    if (t !== toggle) {
                        t.classList.remove('active');
                    }
                });

                // Toggle current submenu
                if (isOpen) {
                    submenu.classList.remove('open');
                    toggle.classList.remove('active');
                } else {
                    submenu.classList.add('open');
                    toggle.classList.add('active');
                }
            });
        });
    }
});
