class PresentationController {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 8;
        this.slides = document.querySelectorAll('.slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.isTransitioning = false;
        
        this.initializeElements();
        this.preventScrollInterference();
        this.bindEvents();
        this.updateSlideDisplay();
        
        console.log('🎯 PresentationController initialized with', this.totalSlides, 'slides');
        console.log('✅ Scroll interference prevention activated');
    }
    
    initializeElements() {
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentSlideSpan = document.getElementById('currentSlide');
        this.totalSlidesSpan = document.getElementById('totalSlides');
        this.progressFill = document.getElementById('progressFill');
        
        // Verificar elementos
        console.log('📋 Navigation elements:', {
            prevBtn: !!this.prevBtn,
            nextBtn: !!this.nextBtn,
            currentSlideSpan: !!this.currentSlideSpan,
            totalSlidesSpan: !!this.totalSlidesSpan,
            progressFill: !!this.progressFill
        });
        
        // Configurar total de slides
        if (this.totalSlidesSpan) {
            this.totalSlidesSpan.textContent = this.totalSlides;
        }
    }
    
    // CRÍTICO: Prevenir completamente la interferencia del scroll con la navegación
    preventScrollInterference() {
        // Deshabilitar scroll en elementos principales
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // Permitir scroll con rueda dentro de .slide-content, prevenir fuera
        const presentationContainer = document.querySelector('.presentation-container');
        if (presentationContainer) {
            presentationContainer.addEventListener('wheel', (e) => {
                const scroller = e.target.closest && e.target.closest('.slide-content');
                if (!scroller) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
        }
        
        // Prevenir scroll con teclas específicas en el documento principal
        document.addEventListener('keydown', (e) => {
            // Lista de teclas que pueden causar scroll no deseado
            const scrollKeys = ['PageDown', 'PageUp', 'Home', 'End', 'ArrowUp', 'ArrowDown'];
            
            // Solo prevenir si es una tecla de scroll y no estamos dentro de slide-content
            if (scrollKeys.includes(e.key) && !e.target.closest('.slide-content')) {
                // Excepto si son nuestras teclas de navegación de presentación
                if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                    return; // Permitir nuestras teclas de navegación
                }
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        // Prevenir gestos de scroll en móviles que puedan interferir
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const deltaY = Math.abs(currentY - touchStartY);
            const insideSlideContent = !!(e.target.closest && e.target.closest('.slide-content'));
            // Permitir desplazamiento vertical dentro del contenido de la diapositiva
            if (insideSlideContent) return;
            // Prevenir desplazamiento del documento fuera del área desplazable
            if (deltaY > 10 && !insideSlideContent) {
                e.preventDefault();
            }
        }, { passive: false });
        
        console.log('🚫 Scroll interference prevention configured');
    }
    
    bindEvents() {
        // Navegación con botones - con prevención de eventos
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⬅️ Previous button clicked');
                this.previousSlide();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➡️ Next button clicked');
                this.nextSlide();
            });
        }
        
        // Navegación con teclado - controlada
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Navegación con indicadores - con prevención
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Indicator clicked:', index);
                this.goToSlide(index);
            });
            
            // Feedback visual
            indicator.style.cursor = 'pointer';
            indicator.setAttribute('tabindex', '0');
            indicator.setAttribute('role', 'button');
            indicator.setAttribute('aria-label', `Ir a diapositiva ${index + 1}`);
        });
        
        // Soporte táctil mejorado
        this.addTouchSupport();
        
        // Manejo de redimensionado
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevenir acciones del navegador que puedan interferir
        document.addEventListener('contextmenu', (e) => {
            // Solo mostrar menú contextual en elementos específicos
            if (!e.target.closest('a') && !e.target.closest('.reference-item')) {
                e.preventDefault();
            }
        });
    }
    
    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isTouchMove = false;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isTouchMove = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            isTouchMove = true;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!isTouchMove) return; // Ignorar taps simples
            
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startX, startY, endX, endY);
        }, { passive: true });
    }
    
    handleKeyboard(e) {
        // Si el foco está dentro del contenido desplazable, permitir teclas de scroll nativas
        const insideScrollable = !!e.target.closest && !!e.target.closest('.slide-content');
        const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (insideScrollable && scrollKeys.includes(e.key)) {
            return; // permitir scroll dentro de la diapositiva
        }

        // Prevenir acción por defecto para teclas de navegación de la presentación
        const navigationKeys = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Home', 'End', 'Escape'];
        if (navigationKeys.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        switch(e.key) {
            case 'ArrowRight':
            case ' ':
            case 'PageDown':
                console.log('⌨️ Keyboard: Next slide');
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                console.log('⌨️ Keyboard: Previous slide');
                this.previousSlide();
                break;
            case 'Home':
                console.log('⌨️ Keyboard: First slide');
                this.goToSlide(0);
                break;
            case 'End':
                console.log('⌨️ Keyboard: Last slide');
                this.goToSlide(this.totalSlides - 1);
                break;
            case 'Escape':
                console.log('⌨️ Keyboard: Reset to first slide');
                this.goToSlide(0);
                break;
            case 'F5':
                e.preventDefault();
                console.log('⌨️ Keyboard: Refresh to first slide');
                this.goToSlide(0);
                break;
        }
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;
        
        // Verificar que sea más horizontal que vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                console.log('👆 Swipe: Previous slide');
                this.previousSlide();
            } else {
                console.log('👆 Swipe: Next slide');
                this.nextSlide();
            }
        }
    }
    
    handleResize() {
        // Mantener configuración de overflow tras redimensionado
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        this.updateSlideDisplay();
    }
    
    nextSlide() {
        if (this.isTransitioning) {
            console.log('⏳ Transition in progress, ignoring navigation');
            return;
        }
        
        console.log('➡️ Next slide requested, current:', this.currentSlide);
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            console.log('🛑 Already at last slide');
            // Feedback visual para última diapositiva
            this.showEndOfPresentationFeedback();
        }
    }
    
    previousSlide() {
        if (this.isTransitioning) {
            console.log('⏳ Transition in progress, ignoring navigation');
            return;
        }
        
        console.log('⬅️ Previous slide requested, current:', this.currentSlide);
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        } else {
            console.log('🛑 Already at first slide');
            // Feedback visual para primera diapositiva
            this.showStartOfPresentationFeedback();
        }
    }
    
    goToSlide(slideIndex) {
        console.log('🎯 Going to slide:', slideIndex);
        
        if (slideIndex >= 0 && slideIndex < this.totalSlides && slideIndex !== this.currentSlide && !this.isTransitioning) {
            this.isTransitioning = true;
            
            // Remover clase active de slide e indicator actual
            if (this.slides[this.currentSlide]) {
                this.slides[this.currentSlide].classList.remove('active');
            }
            if (this.indicators[this.currentSlide]) {
                this.indicators[this.indicators.length - 1 < this.currentSlide ? this.indicators.length - 1 : this.currentSlide].classList.remove('active');
            }
            
            // Actualizar índice
            this.currentSlide = slideIndex;
            
            // Agregar clase active a nuevo slide e indicator
            if (this.slides[this.currentSlide]) {
                this.slides[this.currentSlide].classList.add('active');
            }
            if (this.indicators[this.currentSlide]) {
                this.indicators[this.currentSlide].classList.add('active');
            }
            
            // Actualizar display
            this.updateSlideDisplay();
            
            // Animar contenido
            this.animateSlideContent();
            
            // Permitir nueva transición después de animación
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300);
            
            // Preparar y enfocar el contenedor desplazable de la diapositiva activa
            const currentSlideContent = this.slides[this.currentSlide]?.querySelector('.slide-content');
            if (currentSlideContent) {
                currentSlideContent.scrollTop = 0;
                // Asegurar que pueda recibir foco para scroll con teclado
                if (!currentSlideContent.hasAttribute('tabindex')) {
                    currentSlideContent.setAttribute('tabindex', '0');
                }
                currentSlideContent.focus({ preventScroll: true });
            }
        }
    }
    
    updateSlideDisplay() {
        // Actualizar contador
        if (this.currentSlideSpan) {
            this.currentSlideSpan.textContent = this.currentSlide + 1;
        }
        
        // Actualizar barra de progreso
        if (this.progressFill) {
            const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
            this.progressFill.style.width = `${progress}%`;
        }
        
        // Actualizar estados de botones
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 0;
            this.prevBtn.style.opacity = this.currentSlide === 0 ? '0.4' : '1';
            this.prevBtn.style.cursor = this.currentSlide === 0 ? 'not-allowed' : 'pointer';
            this.prevBtn.setAttribute('aria-disabled', this.currentSlide === 0);
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
            this.nextBtn.style.opacity = this.currentSlide === this.totalSlides - 1 ? '0.4' : '1';
            this.nextBtn.style.cursor = this.currentSlide === this.totalSlides - 1 ? 'not-allowed' : 'pointer';
            this.nextBtn.setAttribute('aria-disabled', this.currentSlide === this.totalSlides - 1);
        }
        
        // Actualizar título de página
        const slideTitles = [
            'Portada - Task 2 Attacking and defending',
            'Pilares de Seguridad Informática',
            'Gestión de Riesgos',
            'Controles de Seguridad',
            'Políticas de Seguridad',
            'Planes de Continuidad',
            'Conclusiones',
            'Referencias'
        ];
        
        document.title = `${slideTitles[this.currentSlide]} - Trabajo colaborativo`;
        
        console.log('📊 Display updated - Slide:', this.currentSlide + 1, 'of', this.totalSlides);
    }
    
    animateSlideContent() {
        const currentSlideElement = this.slides[this.currentSlide];
        if (!currentSlideElement) return;
        
        const contentElements = currentSlideElement.querySelectorAll('.slide-content > *');
        
        // Reset animations
        contentElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
        });
        
        // Animar elementos con timing escalonado
        contentElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });
        
        // Animaciones especiales por tipo de slide
        this.addSpecialAnimations(currentSlideElement);
    }
    
    addSpecialAnimations(slideElement) {
        // Animación para cards de pilares
        const pillarCards = slideElement.querySelectorAll('.pillar-card');
        pillarCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.transform = 'translateY(0) scale(1)';
                card.style.opacity = '1';
            }, 250 + index * 120);
        });
        
        // Animación para pasos de proceso
        const processSteps = slideElement.querySelectorAll('.step');
        processSteps.forEach((step, index) => {
            step.style.opacity = '0';
            step.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                step.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                step.style.transform = 'translateX(0)';
                step.style.opacity = '1';
            }, 300 + index * 100);
        });
        
        // Animación para categorías de control
        const controlCategories = slideElement.querySelectorAll('.control-category');
        controlCategories.forEach((category, index) => {
            category.style.opacity = '0';
            category.style.transform = 'translateY(20px) rotate(-1deg)';
            setTimeout(() => {
                category.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                category.style.transform = 'translateY(0) rotate(0deg)';
                category.style.opacity = '1';
            }, 250 + index * 100);
        });
        
        // Animación para hallazgos
        const findingCards = slideElement.querySelectorAll('.finding-card');
        findingCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.transform = 'translateY(0) scale(1)';
                card.style.opacity = '1';
            }, 200 + index * 130);
        });
        
        // Animación para componentes de continuidad
        const componentCards = slideElement.querySelectorAll('.component-card');
        componentCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.transform = 'translateY(0)';
                card.style.opacity = '1';
            }, 200 + index * 110);
        });
    }
    
    // Feedback visual para límites de presentación
    showEndOfPresentationFeedback() {
        if (this.nextBtn) {
            this.nextBtn.style.transform = 'scale(1.1)';
            this.nextBtn.style.boxShadow = '0 0 15px rgba(var(--color-primary-rgb), 0.4)';
            setTimeout(() => {
                this.nextBtn.style.transform = '';
                this.nextBtn.style.boxShadow = '';
            }, 200);
        }
    }
    
    showStartOfPresentationFeedback() {
        if (this.prevBtn) {
            this.prevBtn.style.transform = 'scale(1.1)';
            this.prevBtn.style.boxShadow = '0 0 15px rgba(var(--color-primary-rgb), 0.4)';
            setTimeout(() => {
                this.prevBtn.style.transform = '';
                this.prevBtn.style.boxShadow = '';
            }, 200);
        }
    }
    
    // Funcionalidad de pantalla completa
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                console.log('📺 Entered fullscreen mode');
            }).catch(err => {
                console.log('❌ Error entering fullscreen:', err.message);
            });
        } else {
            document.exitFullscreen().then(() => {
                console.log('🔲 Exited fullscreen mode');
            });
        }
    }
    
    // Información de estado
    getCurrentSlideData() {
        return {
            current: this.currentSlide,
            total: this.totalSlides,
            progress: ((this.currentSlide + 1) / this.totalSlides) * 100,
            isTransitioning: this.isTransitioning
        };
    }
    
    // Método para debugging
    debugInfo() {
        console.log('🔍 Debug Info:', {
            currentSlide: this.currentSlide,
            totalSlides: this.totalSlides,
            isTransitioning: this.isTransitioning,
            slideElements: this.slides.length,
            indicators: this.indicators.length,
            scrollPrevented: document.body.style.overflow === 'hidden'
        });
    }
}

// Enhancer para funcionalidades adicionales
class PresentationEnhancer {
    constructor(controller) {
        this.controller = controller;
        this.initializeEnhancements();
    }
    
    initializeEnhancements() {
        this.addHoverEffects();
        this.manageFocus();
        this.addAccessibilityFeatures();
        this.addKeyboardShortcuts();
        console.log('✨ Presentation enhancements initialized');
    }
    
    addHoverEffects() {
        const interactiveCards = document.querySelectorAll(`
            .pillar-card, .control-category, .objective-card, 
            .component-card, .finding-card, .contributor-card,
            .step, .stat-card, .reference-item
        `);
        
        interactiveCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
    }
    
    manageFocus() {
        const focusableElements = document.querySelectorAll(`
            button, a, [tabindex]:not([tabindex="-1"]), 
            .indicator, .nav-btn
        `);
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '3px solid rgba(var(--color-primary-rgb), 0.6)';
                element.style.outlineOffset = '2px';
                element.style.borderRadius = 'var(--radius-sm)';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            });
        });
    }
    
    addAccessibilityFeatures() {
        // Configurar roles ARIA
        const slidesWrapper = document.querySelector('.slides-wrapper');
        const navControls = document.querySelector('.nav-controls');
        const slideIndicators = document.querySelector('.slide-indicators');
        
        if (slidesWrapper) slidesWrapper.setAttribute('role', 'main');
        if (navControls) navControls.setAttribute('role', 'navigation');
        if (slideIndicators) slideIndicators.setAttribute('role', 'navigation');
        
        // Anuncios para lectores de pantalla
        const announceSlideChange = (slideNumber, slideTitle) => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.style.position = 'absolute';
            announcement.style.left = '-10000px';
            announcement.style.width = '1px';
            announcement.style.height = '1px';
            announcement.style.overflow = 'hidden';
            announcement.textContent = `Diapositiva ${slideNumber} de ${this.controller.totalSlides}: ${slideTitle}`;
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                if (document.body.contains(announcement)) {
                    document.body.removeChild(announcement);
                }
            }, 1000);
        };
        
        // Hook para anunciar cambios de slide
        const originalGoToSlide = this.controller.goToSlide.bind(this.controller);
        this.controller.goToSlide = (slideIndex) => {
            originalGoToSlide(slideIndex);
            const slideTitles = [
                'Portada del trabajo colaborativo',
                'Pilares fundamentales de la seguridad informática con aportes de Edwin Pantoja y Manuel Menéndez',
                'Gestión de riesgos por Manuel Enrique Menéndez Olivares',
                'Controles de seguridad según ISO 27001 por Manuel Enrique Menéndez Olivares',
                'Políticas de seguridad organizacional por Manuel Enrique Menéndez Olivares',
                'Planes de continuidad investigados por Hernando Arevalo Arevalo y complementados por Manuel Menéndez',
                'Conclusiones del trabajo colaborativo',
                'Referencias académicas y reconocimientos'
            ];
            announceSlideChange(slideIndex + 1, slideTitles[slideIndex]);
        };
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Atajos de teclado avanzados
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Home':
                        e.preventDefault();
                        this.controller.goToSlide(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.controller.goToSlide(this.controller.totalSlides - 1);
                        break;
                    case 'd':
                        e.preventDefault();
                        this.controller.debugInfo();
                        break;
                }
            }
            
            // Atajos especiales
            if (e.key === 'F11') {
                e.preventDefault();
                this.controller.toggleFullscreen();
            }
            
            if (e.key === '?' && e.shiftKey) {
                e.preventDefault();
                this.showHelpDialog();
            }
        });
    }
    
    showHelpDialog() {
        const helpContent = `
🎯 CONTROLES DE NAVEGACIÓN - Task 2 Attacking and defending

⌨️ TECLADO:
• Flechas ← →: Navegar entre diapositivas
• Espacio/PageDown: Siguiente diapositiva
• PageUp: Diapositiva anterior
• Home: Primera diapositiva (Portada)
• End: Última diapositiva (Referencias)
• Escape: Volver al inicio
• F11: Pantalla completa
• Ctrl+D: Información de debug
• Shift+?: Esta ayuda

🖱️ MOUSE/TÁCTIL:
• Botones de navegación (← →)
• Indicadores laterales (●)
• Gestos de deslizar en móviles
• Hover en cards para efectos

📋 ESTRUCTURA DE LA PRESENTACIÓN:
1. Portada - Task 2 Attacking and defending
2. Pilares de Seguridad (Edwin Pantoja + Manuel Menéndez)
3. Gestión de Riesgos (Manuel Menéndez)
4. Controles de Seguridad (Manuel Menéndez)
5. Políticas de Seguridad (Manuel Menéndez)  
6. Planes de Continuidad (Hernando Arevalo + Manuel Menéndez)
7. Conclusiones del trabajo colaborativo
8. Referencias y reconocimientos

✅ PROBLEMAS CORREGIDOS:
• Título principal actualizado
• Scroll deshabilitado para navegación fluida
• Nombres de autores en cada aporte
• Diseño profesional mejorado
        `.trim();
        
        alert(helpContent);
    }
}

// Funciones globales de utilidad
function showHelp() {
    if (window.presentationEnhancer) {
        window.presentationEnhancer.showHelpDialog();
    }
}

function debugPresentation() {
    if (window.presentationController) {
        window.presentationController.debugInfo();
    }
}

// Prevención adicional de scroll durante carga
document.addEventListener('DOMContentLoaded', () => {
    // Prevenir scroll inmediatamente
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    console.log('📄 DOM loaded, initializing Task 2 presentation...');
    
    // Esperar un poco para asegurar renderizado completo
    setTimeout(() => {
        try {
            const presentation = new PresentationController();
            const enhancer = new PresentationEnhancer(presentation);
            
            // Hacer accesible globalmente
            window.presentationController = presentation;
            window.presentationEnhancer = enhancer;
            
            // Configuraciones adicionales
            document.addEventListener('keydown', (e) => {
                // F5 para reiniciar presentación
                if (e.key === 'F5' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    presentation.goToSlide(0);
                }
            });
            
            // Prevenir zoom accidental
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
                    if (!e.target.closest('.slide-content')) {
                        e.preventDefault();
                    }
                }
            });
            
            // Manejo de visibilidad de página
            document.addEventListener('visibilitychange', () => {
                // No forzar overflow aquí para no interferir con el scroll interno
            });
            
            console.log('🎯 Task 2 Attacking and defending - Presentation initialized successfully');
            console.log('✅ Scroll interference eliminated');
            console.log('👥 Authors properly credited in each contribution');
            console.log('📝 Use Shift+? for navigation help');
            console.log('🚀 Ready for professional presentation');
            
            // Inicializar sistema de modales (Edwin)
            (function initModals() {
                const overlay = document.getElementById('modalOverlay');
                const closeBtn = document.getElementById('modalClose');
                const titleEl = document.getElementById('modalTitle');
                const bodyEl = document.getElementById('modalBody');
                const tagButtons = document.querySelectorAll('[data-modal-target]');
                if (!overlay || !closeBtn || !titleEl || !bodyEl) return;

                let lastFocused = null;

                const openModal = (templateId, modalTitle) => {
                    const tpl = document.getElementById(templateId);
                    if (!tpl) return;
                    lastFocused = document.activeElement;

                    // Cargar contenido
                    titleEl.textContent = modalTitle || '';
                    bodyEl.innerHTML = '';
                    bodyEl.appendChild(tpl.content.cloneNode(true));

                    overlay.setAttribute('aria-hidden', 'false');
                    // Bloquear navegación de presentación mientras el modal está abierto
                    presentation.isTransitioning = true;
                    // Permitir scroll solo dentro del modal
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.overflow = 'hidden';
                    // Foco en botón cerrar
                    closeBtn.focus({ preventScroll: true });
                };

                const closeModal = () => {
                    overlay.setAttribute('aria-hidden', 'true');
                    bodyEl.innerHTML = '';
                    presentation.isTransitioning = false;
                    // restaurar comportamiento de scroll controlado por controlador
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.overflow = 'hidden';
                    if (lastFocused && lastFocused.focus) {
                        lastFocused.focus({ preventScroll: true });
                    }
                };

                tagButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const target = btn.getAttribute('data-modal-target');
                        const modalTitle = btn.getAttribute('data-modal-title') || '';
                        openModal(target, modalTitle);
                    });
                });

                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                });

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeModal();
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (overlay.getAttribute('aria-hidden') === 'false') {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            closeModal();
                        }
                        // Prevenir navegación de slides mientras modal abierto
                        const navKeys = ['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End',' '];
                        if (navKeys.includes(e.key)) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                });
            })();

        } catch (error) {
            console.error('❌ Error initializing presentation:', error);
        }
    }, 150);
});

// Prevenir pérdida de configuración durante eventos del navegador
window.addEventListener('beforeunload', () => {
    console.log('💾 Presentation session ending');
});

window.addEventListener('load', () => {
    console.log('🎨 Page fully loaded');
});