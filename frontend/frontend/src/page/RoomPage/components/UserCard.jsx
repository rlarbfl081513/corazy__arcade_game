// src/components/UserCard.jsx
import React from "react";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from './UserCard.module.css';
import grade1 from '@/page/MainPage/assets/grade1.png';
import grade2 from '@/page/MainPage/assets/grade2.png';
import grade3 from '@/page/MainPage/assets/grade3.png';
import grade4 from '@/page/MainPage/assets/grade4.png';
import grade5 from '@/page/MainPage/assets/grade5.png';

export default function UserCard({
  name = "USER_NAME",
  avatar = grade2,
  isHost = false,
  isReady = false,
}) {
  const isEmpty = name === "Waiting...";

  return (
    <div className={cn(styles['user-card'], isEmpty && styles['user-card-empty'])}>
      {/* Avatar */}
      <div className={styles['user-avatar']}>
        {isEmpty ? (
          <div className={styles['empty-avatar']}>?</div>
        ) : (
          <img src={avatar} alt={`${name}'s avatar`} />
        )}
      </div>

      {/* Username */}
      <div className={styles['user-name']}>{name}</div>

      {/* Badge (conditionally rendered) */}
      {!isEmpty && (
        <>
          {isHost ? (
            <div className={cn(styles['user-badge'], styles['host-badge'])}>
              <Crown size={14} />
              HOST
            </div>
          ) : (
            <div className={cn(styles['user-badge'], styles['ready-badge'], isReady && styles['ready-active'])}>
              <Check size={14} />
              READY
            </div>
          )}
        </>
      )}
    </div>
  );
}
