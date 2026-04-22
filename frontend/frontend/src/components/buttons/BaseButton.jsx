import React from "react";
import './BaseButton.css';

export default function BaseButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary', 
  className = '',
  ...rest 
}) {
  const buttonClassName = `base-btn btn-${variant} ${className}`;

  return (
    <button
      type={type}
      className={buttonClassName.trim()} // 양쪽 공백 제거
      onClick={onClick}
      {...rest} // disabled={true} 같은 속성이 여기에 적용됨
    >
      {children}
    </button>
  );
}