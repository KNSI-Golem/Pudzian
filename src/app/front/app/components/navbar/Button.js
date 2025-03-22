import React from 'react';
import Link from 'next/link';

const Button = ({ href = "/login", children = "Sign in" }) => {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg button transition text-center"
    >
      {children}
    </Link>
  );
};

export default Button;
