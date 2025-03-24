import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import Button from "./Button";

const Navbar = () => {
  return (
    <>
      <div className="w-full h-30 navbar sticky top-0">
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            <Logo />
            <div className="flex items-center gap-x-15 text-white font-sans">
              <ul className="hidden md:flex gap-x-15">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About</Link></li>
              </ul>
              <Button />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;