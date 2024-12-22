function speakText(text) {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    
    // console.log(...voices)
    // Ensure voices are loaded
    if (!voices.length) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        speak();
      };
    } else {
      speak();
    }
  
    function speak() {
      const utterance = new SpeechSynthesisUtterance(text);
  
      // Select a female voice (you can adjust this to your preference)
      const selectedVoice = voices.find(voice => 
        voice.name.includes('Microsoft Mark - English (United States)')
      );
  
      // Set the selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
  
      // Other properties (optional)
      utterance.pitch = 1;
      utterance.rate = 1.3;
  
      // Speak the text
      synth.speak(utterance);
    }
  }

  export {speakText}
  

  