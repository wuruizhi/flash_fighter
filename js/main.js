/* ============================================
   Flash Fighter - Entry Point
   ============================================ */
(function() {
    'use strict';
    window.addEventListener('load', () => {
        const canvas = document.getElementById('gameCanvas');
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loadingBar');
        let progress = 0;
        const loadInterval = setInterval(() => {
            progress += 5 + Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadInterval);
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    const game = new FF.Game(canvas);
                    game.start();
                }, 400);
            } else {
                loadingBar.style.width = progress + '%';
            }
        }, 80);
    });
})();
