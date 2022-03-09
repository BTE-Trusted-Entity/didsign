import React from 'react'
import Logo from '../ImageAssets/logo_DIDsign.svg'
import KiltLogo from '../ImageAssets/Kilt.svg'

export const Footer = () => {
  return (
    <div className=" bg-dark-purple flex items-center justify-center   h-[35px] w-screen relative mt-auto  big-phone:h-28 ">
      <div className="flex items-center justify-center w-[766px] h-full relative">
        <img
          className=" h-[27px] absolute left-0 small-device:pl-[15px] phone:invisible"
          src={Logo}
        />

        <div className="items-center flex flex-wrap max-w-3/4 justify-center space-x-2 text-white font-['Overpass'] text-[14px] leading-[16px] tracking-[0.1px]">
          <span>Imprint </span>
          <span>-</span>
          <span>Terms and Conditions</span>
          <span>-</span>
          <span>Privacy Policy </span>
        </div>

        <img
          className=" h-[15px] absolute right-0 big-phone:invisible small-device:pr-[15px] phone:invisible "
          src={KiltLogo}
        />
      </div>
    </div>
  )
}
