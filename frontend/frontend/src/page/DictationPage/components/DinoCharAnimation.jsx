// src/page/DictationPage/components/PhaserDinoChar.jsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

function DinoCharAnimation({ progress }) {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const config = {
      type: Phaser.AUTO,
      width: 200,
      height: 250,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
      scene: {
        preload,
        create,
        update,
      },
      transparent: true,
      disableContextMenu: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    let character;
    let isBouncing = false;

    function preload() {
      this.load.image('angry', '@/page/DictationPage/assets/char/angry.png');
      this.load.image('excited', '@/page/DictationPage/assets/char/excited.png');
      this.load.image('freakout', '@/page/DictationPage/assets/char/freakout.png');
      this.load.image('normal', '@/page/DictationPage/assets/char/normal.png');
      this.load.image('relieved', '@/page/DictationPage/assets/char/relieved.png');
    }

    function create() {
      // Center the character
      character = this.add.image(100, 180, 'normal').setScale(0.8);

      // Static idle animation (subtle breathing or loop)
      this.anims.create({
        key: 'normal',
        // // frames: [
        // //   { key: 'idle1' },
        // //   { key: 'idle2' },
        // // ],
        // frameRate: 2,
        // repeat: -1,
      });
      character.play('normal');
    }

    function update() {
      // Dynamic bounce when typing fast or on milestone
      const shouldBounce = progress > 0 && !isBouncing;

      if (shouldBounce && Math.random() < 0.1) { // 10% chance per frame when active
        isBouncing = true;
        character.setTexture('angry');
        this.tweens.add({
          targets: character,
          y: '-=40',
          duration: 200,
          yoyo: true,
          onComplete: () => {
            character.setTexture('excited');
            character.play('normal');
            isBouncing = false;
          },
        });
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Optional: re-trigger bounce on progress change
  useEffect(() => {
    // You can pass events via refs or context if needed
  }, [progress]);

  return (
    <div
      ref={gameContainerRef}
      style={{
        width: '200px',
        height: '250px',
        margin: '0 auto',
        marginBottom: '16px',
        pointerEvents: 'none', // Prevent blocking clicks
      }}
    />
  );
}

export default DinoCharAnimation;