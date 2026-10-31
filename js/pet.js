/**
 * MY LITTLE JOURNAL - Pixel Pet Companion "Momo-chan"
 * A cute pastel bunny-cat hybrid companion with idle animations and sweet interactions.
 */

const Pet = (() => {
  const QUOTES = [
    "今天也辛苦了~ 記帳是愛自己的第一步 ♡",
    "看見小主人這麼認真存錢，Momo好感動！✨",
    "買喜歡的裙子和香水之前，先確認一下預算喔~ 🎀",
    "叮咚！今天的閃亮手帳已蓋上好棒印章！💮",
    "給認真記帳的你一個大大的擁抱 (´,,•ω•,,)♡",
    "每一筆小花費，都是生活真實又可愛的足跡呢~",
    "摸摸~ 肚子要吃飽，小錢包也要飽飽的喔！🍰",
    "今天的心情也是粉粉嫩嫩的草莓口味嗎？🍓",
    "就算只存下一點點，也是朝夢想邁進了一大步！⭐",
    "Momo隨時都在這裡陪著你記帳唷~ 🌸"
  ];

  let petContainer = null;
  let speechBubble = null;
  let petImg = null;
  let speechTimer = null;
  let happyTimer = null;

  return {
    init() {
      petContainer = document.getElementById('pixel-pet-box');
      if (!petContainer) return;

      speechBubble = document.getElementById('pet-speech-bubble');
      petImg = document.getElementById('pet-avatar-img');

      if (petContainer) {
        petContainer.addEventListener('click', () => {
          this.interact();
        });
      }
    },

    interact(customText = null) {
      if (typeof window.Sound !== 'undefined') {
        window.Sound.playPet();
      }

      // Sparkle burst over pet
      if (typeof window.Cursor !== 'undefined' && petContainer) {
        const rect = petContainer.getBoundingClientRect();
        window.Cursor.burst(rect.left + rect.width / 2, rect.top + rect.height / 3, 10);
      }

      // Switch to happy face
      if (petImg) {
        petImg.src = 'assets/pets/momo_happy.svg';
        petImg.classList.add('pet-happy-bounce');
        clearTimeout(happyTimer);
        happyTimer = setTimeout(() => {
          petImg.src = 'assets/pets/momo.svg';
          petImg.classList.remove('pet-happy-bounce');
        }, 2200);
      }

      // Show speech bubble
      if (speechBubble) {
        const quote = customText || QUOTES[Math.floor(Math.random() * QUOTES.length)];
        speechBubble.textContent = quote;
        speechBubble.classList.add('visible');

        clearTimeout(speechTimer);
        speechTimer = setTimeout(() => {
          speechBubble.classList.remove('visible');
        }, 4000);
      }
    },

    greetNewRecord() {
      const compliments = [
        "好棒！又為手帳添上一筆閃耀紀錄囉~ ✨",
        "記錄完成！小錢包的管理力又提升了！👛",
        "記帳完成！今天的自律值滿分！💮"
      ];
      const pick = compliments[Math.floor(Math.random() * compliments.length)];
      this.interact(pick);
    }
  };
})();

// Attach to window
window.Pet = Pet;
