import React from 'react'
import { ImportFilesSigner } from './ImportFiles'
import { FileList } from './FileList'
import { useAppSelector } from '../app/hooks'
import { selectFile } from '../Features/Signer/FileSlice'
import { EmptyFilesList } from './EmptyFilesList'
import CenterRightBubble from '../ImageAssets/CenterRightBubble.svg'
import CenterLeftBubble from '../ImageAssets/CenterLeftBubble.svg'

export const SignerComponent = () => {
  const files = useAppSelector(selectFile)
  return (
    <div
      id="sign-component"
      className=" bg-silver-blue w-screen relative overflow-x-hidden small-device:pr-[15px] small-device:pl-[15px]"
    >
      <ImportFilesSigner />
      <div
        className={`overflow-y-auto overflow-x-hidden relative flex-col -space-y-1 mx-auto max-w-[766px] min-h-[211px] max-h-[900px]
        bg-light-blue bg-opacity-80 border-solid border-[#517ca240] border-t-[1px] border-l-[1px] border-r-[1px]`}
      >
        <span className="absolute top-4 left-8 big-phone:left-2 text-[#2a223180] font-[Overpass Regular] text-[16px] leading-[17px] tracking-[0.11px] w-[34px]">
          Files
        </span>
        {files.length === 0 ? <EmptyFilesList /> : <FileList />}
      </div>
      <img
        src={CenterLeftBubble}
        className="absolute bottom-0 left-0 h-[105px] w-[343.5px]  pointer-events-none"
      />
      <img
        src={CenterRightBubble}
        className=" absolute bottom-0 right-0 h-[105px] w-[248px] pointer-events-none"
      />
    </div>
  )
}
