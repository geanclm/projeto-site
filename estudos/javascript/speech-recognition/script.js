const startButton = document.getElementById('startButton');
const outputDiv = document.getElementById('output');

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Você disse:', transcript);
        outputDiv.textContent = transcript;
    };

    recognition.onerror = function(event) {
        console.error('Erro de reconhecimento de fala:', event.error);
    };

    startButton.addEventListener('click', function() {
        recognition.start();
        startButton.disabled = true;
    });
} else {
    console.error('API de Reconhecimento de Fala não suportada pelo navegador.');
    startButton.textContent = 'Reconhecimento de Fala não suportado';
    startButton.disabled = true;
}