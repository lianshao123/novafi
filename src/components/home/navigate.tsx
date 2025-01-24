import Logo from "@/assets/logo.png"
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navigate() {
  return (
    <div>
      <header className='bg-[#343357] w-screen flex justify-center'>
        <nav className='w-[1300px] flex h-[75px] items-center justify-between'>
          <div className="flex items-center">
            <img src={Logo} alt="" className="w-[50px] h-[50px]"/>
            <span className="font-extrabold text-2xl ml-2 text-white">NOVAFI</span>
          </div>
          <div className="flex items-center font-bold text-xl mr-2">
            <ConnectButton showBalance={false} chainStatus="icon"/>
          </div>
        </nav>
      </header>
    </div>

  )
}
