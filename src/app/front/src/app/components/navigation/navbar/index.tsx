import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import Button from "./Button";

const Navbar = () => {
  return (
    <>
      <div className="w-full h-20 sticky top-0">
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            <Logo />
            <ul className="flex gap-x-6 text-white ml-auto">
            <li>
                <Link href="/play">
                  <p>Play</p>
                </Link>
            </li>
              <li>
                <Link href="/about">
                  <p>About Us</p>
                </Link>
              </li>
            </ul>
            <Button/>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;