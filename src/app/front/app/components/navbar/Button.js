import React from 'react';

const Button = ({ onClick, children = "Sign in" }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg button transition cursor-pointer"
    >
      {children}
    </button>
  );
};

export default Button;
