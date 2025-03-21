import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={140}
        height={60}
        priority
      />
    </Link>
  );
};

export default Logo;
